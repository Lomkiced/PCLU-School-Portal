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

    async getInheritedSubjects(sectionId: string, academicYearId?: string) {
        const section = await this.prisma.section.findUnique({
            where: { id: sectionId },
            select: { gradeLevelId: true }
        });

        if (!section) throw new NotFoundException('Section not found');

        // Get active academic year if not provided
        if (!academicYearId) {
            const ay = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
            if (!ay) throw new BadRequestException('No active academic year found');
            academicYearId = ay.id;
        }

        // 1. Fetch all subjects for this Grade Level
        const gradeSubjects = await this.prisma.subject.findMany({
            where: { gradeLevelId: section.gradeLevelId },
            orderBy: { code: 'asc' }
        });

        // 2. Fetch all explicit section-subject assignments for this section (to get teacher assignments)
        const assignedSubjects = await this.prisma.sectionSubject.findMany({
            where: { sectionId, academicYearId },
            include: { teacher: true }
        });

        // 3. Left Join
        return gradeSubjects.map(subject => {
            const assignment = assignedSubjects.find((a: any) => a.subjectId === subject.id);
            return {
                ...subject,
                assignmentId: assignment?.id || null,
                teacherId: assignment?.teacherId || null,
                teacher: assignment?.teacher || null,
            };
        });
    }

    async assignTeacher(sectionId: string, subjectId: string, data: { teacherId: string; academicYearId: string }) {
        return this.prisma.sectionSubject.upsert({
            where: {
                subjectId_sectionId_academicYearId: {
                    subjectId,
                    sectionId,
                    academicYearId: data.academicYearId,
                }
            },
            update: {
                teacherId: data.teacherId,
            },
            create: {
                sectionId,
                subjectId,
                teacherId: data.teacherId,
                academicYearId: data.academicYearId,
            },
            include: { teacher: true, subject: true }
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
