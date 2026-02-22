import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicYearsService {
    constructor(private prisma: PrismaService) { }

    async create(data: { label: string; startDate: Date; endDate: Date; isActive?: boolean }) {
        return this.prisma.$transaction(async (tx) => {
            if (data.isActive) {
                await tx.academicYear.updateMany({ data: { isActive: false } });
            }
            return tx.academicYear.create({
                data: {
                    label: data.label,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                    isActive: data.isActive || false,
                }
            });
        });
    }

    async findAll() {
        return this.prisma.academicYear.findMany({ orderBy: { startDate: 'desc' } });
    }

    async setActive(id: string) {
        return this.prisma.$transaction(async (tx) => {
            await tx.academicYear.updateMany({ data: { isActive: false } });
            return tx.academicYear.update({
                where: { id },
                data: { isActive: true }
            });
        });
    }
}
