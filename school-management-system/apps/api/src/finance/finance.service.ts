import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    async createFeeStructure(data: any) {
        return this.prisma.feeStructure.create({ data });
    }

    async bulkAssignFees(data: { feeStructureId: string; gradeLevel: string; academicYear: string }) {
        const feeStructure = await this.prisma.feeStructure.findUnique({ where: { id: data.feeStructureId } });
        if (!feeStructure) throw new NotFoundException('Fee Structure not found');

        const enrollments = await this.prisma.subjectEnrollment.findMany({
            where: {
                section: { gradeLevel: { name: data.gradeLevel } }, // Match grade level string or by ID
                academicYearId: data.academicYear
            },
            distinct: ['studentId']
        });

        const studentFees = enrollments.map(e => ({
            studentId: e.studentId,
            feeStructureId: feeStructure.id,
            amountDue: feeStructure.amount,
            amountPaid: 0,
            balance: feeStructure.amount,
            status: 'UNPAID' as any,
            dueDate: new Date()
        }));

        if (studentFees.length > 0) {
            await this.prisma.studentFee.createMany({ data: studentFees });
        }

        return { count: studentFees.length };
    }

    async getStudentLedger(studentId: string) {
        return this.prisma.studentFee.findMany({
            where: { studentId },
            include: {
                feeStructure: true,
                payments: true
            }
        });
    }

    async recordPayment(studentFeeId: string, data: { amountPaid: number; paymentDate: string; referenceNumber?: string; method: string }) {
        return this.prisma.$transaction(async (tx) => {
            const studentFee = await tx.studentFee.findUnique({ where: { id: studentFeeId } });
            if (!studentFee) throw new NotFoundException('Student Fee not found');

            const payment = await tx.paymentRecord.create({
                data: {
                    studentFeeId,
                    amountPaid: data.amountPaid,
                    paymentDate: new Date(data.paymentDate || Date.now()),
                    referenceNumber: data.referenceNumber,
                    method: data.method
                }
            });

            const newAmountPaid = studentFee.amountPaid + data.amountPaid;
            const newBalance = studentFee.amountDue - newAmountPaid;
            const status = newBalance <= 0 ? 'PAID' : (newAmountPaid > 0 ? 'PARTIAL' : 'UNPAID');

            await tx.studentFee.update({
                where: { id: studentFeeId },
                data: { amountPaid: newAmountPaid, balance: newBalance, status: status as any }
            });

            return payment;
        });
    }

    async getCollectionSummary(startDate: string, endDate: string) {
        return this.prisma.paymentRecord.aggregate({
            where: {
                paymentDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            _sum: { amountPaid: true }
        });
    }
}
