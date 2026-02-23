import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
    constructor(private prisma: PrismaService) { }

    async create(data: { name: string; headTeacherId?: string }) {
        return this.prisma.department.create({ data });
    }

    async findAll() {
        return this.prisma.department.findMany({
            include: {
                headTeacher: {
                    select: { firstName: true, lastName: true },
                },
                _count: { select: { teachers: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const dept = await this.prisma.department.findUnique({
            where: { id },
            include: {
                headTeacher: {
                    select: { firstName: true, lastName: true },
                },
                teachers: {
                    include: {
                        user: { select: { email: true } },
                    },
                    orderBy: { lastName: 'asc' },
                },
                _count: { select: { teachers: true } },
            },
        });
        if (!dept) throw new NotFoundException('Department not found');
        return dept;
    }
}
