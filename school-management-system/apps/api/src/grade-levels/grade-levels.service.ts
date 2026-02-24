import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SchoolLevel } from '@sms/database';

@Injectable()
export class GradeLevelsService {
    constructor(private prisma: PrismaService) { }

    async create(data: { name: string; schoolLevel: SchoolLevel }) {
        return this.prisma.gradeLevel.create({ data });
    }

    async findAll() {
        return this.prisma.gradeLevel.findMany({
            include: {
                sections: {
                    include: {
                        _count: { select: { students: true } },
                    },
                },
                _count: { select: { sections: true, students: true, subjects: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const gradeLevel = await this.prisma.gradeLevel.findUnique({
            where: { id },
            include: {
                sections: {
                    include: {
                        adviser: true,
                        room: true,
                        _count: { select: { students: true } },
                    },
                    orderBy: { name: 'asc' },
                },
                _count: { select: { sections: true, students: true, subjects: true } },
            },
        });
        if (!gradeLevel) throw new NotFoundException('Grade level not found');
        return gradeLevel;
    }
}
