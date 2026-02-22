import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SectionsService {
    constructor(private prisma: PrismaService) { }

    async create(data: { name: string; capacity: number; gradeLevelId: string; adviserId?: string; roomId?: string }) {
        return this.prisma.section.create({ data });
    }

    async findAll(gradeLevelId?: string) {
        return this.prisma.section.findMany({
            where: gradeLevelId ? { gradeLevelId } : undefined,
            include: {
                adviser: true,
                room: true,
                gradeLevel: true,
                _count: { select: { students: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const section = await this.prisma.section.findUnique({
            where: { id },
            include: {
                adviser: true,
                room: true,
                gradeLevel: true,
                students: {
                    include: {
                        user: { select: { email: true, profilePicture: true } },
                    },
                    orderBy: { lastName: 'asc' },
                },
                _count: { select: { students: true } },
            },
        });
        if (!section) throw new NotFoundException('Section not found');
        return section;
    }
}
