import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
                        parents: { select: { firstName: true, lastName: true, contactNumber: true } },
                    },
                    orderBy: { lastName: 'asc' },
                },
                sectionSubjects: {
                    include: {
                        subject: true,
                        teacher: true,
                    }
                },
                _count: { select: { students: true } },
            },
        });
        if (!section) throw new NotFoundException('Section not found');
        return section;
    }

    async addSubject(sectionId: string, data: { subjectId: string; teacherId: string; academicYearId: string }) {
        // Check for existing assignment
        const existing = await this.prisma.sectionSubject.findFirst({
            where: { sectionId, subjectId: data.subjectId, academicYearId: data.academicYearId },
        });

        if (existing) {
            throw new BadRequestException('This subject is already assigned to this section for the current academic year.');
        }

        return this.prisma.sectionSubject.create({
            data: {
                sectionId,
                subjectId: data.subjectId,
                teacherId: data.teacherId,
                academicYearId: data.academicYearId,
            }
        });
    }

    async removeSubject(sectionId: string, subjectId: string) {
        // Find the record first since we don't have the unique ID
        const record = await this.prisma.sectionSubject.findFirst({
            where: { sectionId, subjectId }
        });

        if (!record) {
            throw new NotFoundException('Subject assignment not found for this section');
        }

        return this.prisma.sectionSubject.delete({
            where: { id: record.id }
        });
    }
}
