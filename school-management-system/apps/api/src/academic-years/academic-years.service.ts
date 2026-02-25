import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicYearDto } from './dto/academic-year.dto';
import { BulkCreateGradingPeriodsDto } from './dto/grading-period.dto';

@Injectable()
export class AcademicYearsService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateAcademicYearDto) {
        return this.prisma.$transaction(async (tx) => {
            if (data.isDefault) {
                await tx.academicYear.updateMany({ data: { isDefault: false } });
            }
            return tx.academicYear.create({
                data: {
                    name: data.name,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                    isDefault: data.isDefault || false,
                    status: 'UPCOMING',
                }
            });
        });
    }

    async findAll() {
        return this.prisma.academicYear.findMany({
            orderBy: { startDate: 'desc' },
            include: { gradingPeriods: true }
        });
    }

    async activate(id: string) {
        return this.prisma.$transaction(async (tx) => {
            // Unset current active to archived
            await tx.academicYear.updateMany({
                where: { status: 'ACTIVE' },
                data: { status: 'ARCHIVED' }
            });
            // Set new active
            return tx.academicYear.update({
                where: { id },
                data: { status: 'ACTIVE' }
            });
        });
    }

    async close(id: string) {
        return this.prisma.academicYear.update({
            where: { id },
            data: { status: 'ARCHIVED' }
        });
    }

    async updateGradingPeriods(id: string, data: BulkCreateGradingPeriodsDto) {
        // Validate weight sum
        const totalWeight = data.periods.reduce((sum, p) => sum + p.weight, 0);
        if (totalWeight !== 100) {
            throw new BadRequestException('Configuration Error: Grading period weights must sum to exactly 100%');
        }

        return this.prisma.$transaction(async (tx) => {
            // Delete existing ones
            await tx.gradingPeriod.deleteMany({
                where: { academicYearId: id }
            });

            // Create new ones
            await tx.gradingPeriod.createMany({
                data: data.periods.map(p => ({
                    name: p.name,
                    weight: p.weight,
                    startDate: new Date(p.startDate),
                    endDate: new Date(p.endDate),
                    dueDate: new Date(p.dueDate),
                    academicYearId: id,
                }))
            });

            return tx.academicYear.findUnique({
                where: { id },
                include: { gradingPeriods: true }
            });
        });
    }
}
