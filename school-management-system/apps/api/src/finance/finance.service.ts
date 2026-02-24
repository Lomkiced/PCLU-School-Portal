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

    async getStudentLedgersByGrade(gradeLevelId: string) {
        const students = await this.prisma.studentProfile.findMany({
            where: { gradeLevelId, enrollmentStatus: 'ENROLLED' },
            include: { user: true }
        });

        const studentIds = students.map(s => s.id);
        const invoices = await this.prisma.invoice.findMany({
            where: { studentId: { in: studentIds } },
            include: { payments: true }
        });

        return students.map(student => {
            const studentInvoices = invoices.filter(i => i.studentId === student.id);
            const totalInvoiced = studentInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
            const totalDiscounts = studentInvoices.reduce((sum, inv) => sum + ((inv as any).discountAmount || 0), 0);

            let totalPaid = 0;
            studentInvoices.forEach(inv => {
                totalPaid += inv.payments.reduce((sum, p) => sum + p.amountPaid, 0);
            });

            const outstandingBalance = totalInvoiced - totalDiscounts - totalPaid;

            return {
                studentId: student.id,
                systemId: student.studentId,
                name: `${student.firstName} ${student.lastName}`,
                totalInvoiced,
                totalPaid,
                totalDiscounts,
                outstandingBalance
            };
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

    async generateInvoiceBatch(gradeLevelId: string, feeStructureId: string) {
        // Fetch students actively enrolled in this grade level
        const students = await this.prisma.studentProfile.findMany({
            where: { gradeLevelId, enrollmentStatus: 'ENROLLED' },
            select: { id: true }
        });

        const studentIds = students.map(s => s.id);
        if (studentIds.length === 0) throw new BadRequestException('No enrolled students found for this grade level.');

        return this.prisma.$transaction(async (tx) => {
            const structure = await tx.feeStructure.findUnique({
                where: { id: feeStructureId },
                include: { feeItems: true }
            });
            if (!structure) throw new NotFoundException('Fee Structure not found.');

            const totalAmount = structure.feeItems.reduce((acc, curr) => acc + curr.amount, 0);
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);

            // Filter out existing invoices
            const existingInvoices = await tx.invoice.findMany({
                where: { feeStructureId, studentId: { in: studentIds } },
                select: { studentId: true }
            });
            const existingIds = new Set(existingInvoices.map(i => i.studentId));
            const newStudentIds = studentIds.filter(id => !existingIds.has(id));

            if (newStudentIds.length === 0) {
                return { count: 0, message: 'All students in this grade already have this invoice.' };
            }

            const invoicesData = newStudentIds.map(studentId => ({
                studentId,
                feeStructureId,
                academicYearId: structure.academicYearId,
                totalAmount,
                discountAmount: 0,
                dueDate,
                status: InvoiceStatus.PENDING
            }));

            const result = await tx.invoice.createMany({
                data: invoicesData
            });

            return { count: result.count, message: `Successfully generated ${result.count} invoices.` };
        });
    }

    async applyDiscount(invoiceId: string, data: { discountAmount: number; discountReason: string }) {
        if (data.discountAmount < 0) throw new BadRequestException('Discount cannot be negative.');

        return this.prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({
                where: { id: invoiceId },
                include: { payments: true }
            });
            if (!invoice) throw new NotFoundException('Invoice not found.');

            const totalPaid = invoice.payments.reduce((acc, curr) => acc + curr.amountPaid, 0);
            const discountAmount = data.discountAmount;
            const adjustedTotal = invoice.totalAmount - discountAmount;

            let newStatus: InvoiceStatus = InvoiceStatus.PENDING;
            if (totalPaid >= adjustedTotal && adjustedTotal > 0) {
                newStatus = InvoiceStatus.PAID;
            } else if (totalPaid >= adjustedTotal && adjustedTotal <= 0 && invoice.payments.length > 0) {
                newStatus = InvoiceStatus.PAID;
            } else if (totalPaid >= adjustedTotal && adjustedTotal <= 0) {
                newStatus = InvoiceStatus.PAID; // Fully discounted
            } else if (totalPaid > 0 || discountAmount > 0) {
                newStatus = InvoiceStatus.PARTIAL;
            }

            // @ts-ignore
            return (tx.invoice as any).update({
                where: { id: invoiceId },
                data: {
                    discountAmount,
                    discountReason: data.discountReason,
                    status: newStatus
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
                    referenceNumber: data.referenceNumber?.trim() || null
                }
            });

            // Re-calculate Total mathematical ledger status
            const allPayments = await tx.payment.findMany({ where: { invoiceId: invoice.id } });
            const totalPaid = allPayments.reduce((acc, curr) => acc + curr.amountPaid, 0);

            const discountAmount = (invoice as any).discountAmount || 0;
            const adjustedTotal = invoice.totalAmount - discountAmount;

            let newStatus: InvoiceStatus = InvoiceStatus.PENDING;
            if (totalPaid >= adjustedTotal && adjustedTotal > 0) {
                newStatus = InvoiceStatus.PAID;
            } else if (totalPaid >= adjustedTotal && adjustedTotal <= 0 && invoice.payments.length > 0) {
                newStatus = InvoiceStatus.PAID;
            } else if (totalPaid >= adjustedTotal && adjustedTotal <= 0) {
                newStatus = InvoiceStatus.PAID; // Fully discounted
            } else if (totalPaid > 0 || discountAmount > 0) {
                newStatus = InvoiceStatus.PARTIAL;
            }

            // Apply status
            await (tx.invoice as any).update({
                where: { id: invoice.id },
                data: { status: newStatus }
            });

            return payment;
        });
    }
}
