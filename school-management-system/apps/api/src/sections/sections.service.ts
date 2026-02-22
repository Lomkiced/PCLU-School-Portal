import { Injectable } from '@nestjs/common';
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
            include: { adviser: true, room: true, gradeLevel: true }
        });
    }

    async findOne(id: string) {
        return this.prisma.section.findUnique({
            where: { id },
            include: {
                adviser: true,
                room: true,
                gradeLevel: true,
                students: {
                    include: { attendance: true, user: true }
                }
            }
        });
    }
}
