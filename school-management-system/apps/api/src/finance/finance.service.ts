import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus } from '@sms/database';

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    // --- FEE STRUCTURES ---

    async getFeeStructures(academicYearId?: string) {
        return this.prisma.feeStructure.findMany({
            where: academicYearId ? { academicYearId } : undefined,
            include: {
                gradeLevel: true,
                academicYear: true,
                feeItems: true,
            }
        });
    }

    async createFeeStructure(data: { name: string; gradeLevelId?: string; academicYearId: string; feeItems: { name: string; amount: number }[] }) {
        if (!data.feeItems || data.feeItems.length === 0) {
            throw new BadRequestException('A Fee Structure must contain at least one Fee Item.');
        }

        return this.prisma.$transaction(async (tx) => {
            const sumTotal = data.feeItems.reduce((acc, curr) => acc + curr.amount, 0);

            return tx.feeStructure.create({
                data: {
                    name: data.name,
                    gradeLevelId: data.gradeLevelId,
                    academicYearId: data.academicYearId,
                    feeItems: {
                        create: data.feeItems.map(item => ({
                            name: item.name,
                            amount: item.amount
                        }))
                    }
                },
                include: { feeItems: true }
            });
        });
    }

    async updateFeeStructure(id: string, data: { name: string; gradeLevelId?: string; feeItems: { id?: string; name: string; amount: number }[] }) {
        if (!data.feeItems || data.feeItems.length === 0) {
            throw new BadRequestException('A Fee Structure must contain at least one Fee Item.');
        }

        return this.prisma.$transaction(async (tx) => {
            // Wipe old items and recreate to ensure exact match without complex diffing
            await tx.feeItem.deleteMany({ where: { feeStructureId: id } });

            return tx.feeStructure.update({
                where: { id },
                data: {
                    name: data.name,
                    gradeLevelId: data.gradeLevelId || null,
                    feeItems: {
                        create: data.feeItems.map(item => ({
                            name: item.name,
                            amount: item.amount
                        }))
                    }
                },
                include: { feeItems: true }
            });
        });
    }

    async deleteFeeStructure(id: string) {
        // Prevent deletion if already referenced in Invoices
        const invoices = await this.prisma.invoice.findFirst({ where: { feeStructureId: id } });
        if (invoices) {
            throw new BadRequestException('Cannot delete a Fee Structure that has already been issued in Invoices.');
        }

        return this.prisma.feeStructure.delete({
            where: { id }
        });
    }

    // --- INVOICES ---

    async getInvoices(studentId?: string) {
        return this.prisma.invoice.findMany({
            where: studentId ? { studentId } : undefined,
            include: {
                student: { include: { user: true } },
                feeStructure: { include: { feeItems: true } },
                payments: true
            },
            orderBy: { dueDate: 'asc' }
        });
    }

    async generateInvoice(studentId: string, feeStructureId: string) {
        return this.prisma.$transaction(async (tx) => {
            // Validate Structure exists and has items
            const structure = await tx.feeStructure.findUnique({
                where: { id: feeStructureId },
                include: { feeItems: true }
            });

            if (!structure) throw new NotFoundException('Fee Structure not found.');

            // Check if already invoiced to prevent double billing
            const existing = await tx.invoice.findUnique({
                where: { studentId_feeStructureId: { studentId, feeStructureId } }
            });

            if (existing) throw new BadRequestException('An invoice for this fee structure already exists for this student.');

            // Calculate exact sum
            const totalAmount = structure.feeItems.reduce((acc, curr) => acc + curr.amount, 0);

            // Default due date to 30 days from now
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);

            return tx.invoice.create({
                data: {
                    studentId,
                    feeStructureId,
                    academicYearId: structure.academicYearId,
                    totalAmount,
                    dueDate,
                    status: InvoiceStatus.PENDING
                }
            });
        });
    }

    // --- PAYMENTS ---

    async getPayments() {
        return this.prisma.payment.findMany({
            include: {
                invoice: { include: { student: true } }
            },
            orderBy: { paymentDate: 'desc' }
        });
    }

    async recordPayment(data: { invoiceId: string; amountPaid: number; method: string; referenceNumber?: string }) {
        if (data.amountPaid <= 0) {
            throw new BadRequestException('Payment amount must be greater than zero.');
        }

        return this.prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({
                where: { id: data.invoiceId },
                include: { payments: true }
            });

            if (!invoice) throw new NotFoundException('Invoice not found.');

            // Create record
            const payment = await tx.payment.create({
                data: {
                    invoiceId: invoice.id,
                    amountPaid: data.amountPaid,
                    method: data.method,
                    referenceNumber: data.referenceNumber
                }
            });

            // Re-calculate Total mathematical ledger status
            const allPayments = await tx.payment.findMany({ where: { invoiceId: invoice.id } });
            const totalPaid = allPayments.reduce((acc, curr) => acc + curr.amountPaid, 0);

            let newStatus: InvoiceStatus = InvoiceStatus.PENDING;
            if (totalPaid >= invoice.totalAmount) {
                newStatus = InvoiceStatus.PAID;
            } else if (totalPaid > 0) {
                newStatus = InvoiceStatus.PARTIAL;
            }

            // Apply status
            await tx.invoice.update({
                where: { id: invoice.id },
                data: { status: newStatus }
            });

            return payment;
        });
    }
}
