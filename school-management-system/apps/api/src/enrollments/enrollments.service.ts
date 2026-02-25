import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentStatus } from '@sms/database';

@Injectable()
export class EnrollmentsService {
    constructor(private prisma: PrismaService) { }

    async enrollStudent(data: { studentId: string; subjectId: string; sectionId: string; academicYearId: string }) {
        const subject = await this.prisma.subject.findUnique({
            where: { id: data.subjectId },
            include: { prerequisites: true }
        });

        if (!subject) throw new BadRequestException('Subject not found');

        if (subject.prerequisites.length > 0) {
            const pastGrades = await this.prisma.grade.findMany({
                where: {
                    studentId: data.studentId,
                    subjectId: { in: subject.prerequisites.map(p => p.id) },
                    finalGrade: { gte: 75 }
                }
            });
            const passedSubjectIds = pastGrades.map(g => g.subjectId);

            const missingPrereqs = subject.prerequisites.filter(p => !passedSubjectIds.includes(p.id));
            if (missingPrereqs.length > 0) {
                throw new BadRequestException(`Student has not passed the required prerequisites: ${missingPrereqs.map(m => m.code).join(', ')}`);
            }
        }

        return this.prisma.subjectEnrollment.create({
            data: {
                studentId: data.studentId,
                subjectId: data.subjectId,
                sectionId: data.sectionId,
                academicYearId: data.academicYearId,
                status: 'IN_PROGRESS' as any
            }
        });
    }

    async getEnrollments(studentId: string, academicYearId?: string) {
        return this.prisma.subjectEnrollment.findMany({
            where: {
                studentId,
                ...(academicYearId ? { academicYearId } : {})
            },
            include: { subject: true, section: true }
        });
    }

    async promoteBatch(data: { studentIds: string[]; sourceAcademicYearId: string; targetAcademicYearId: string; targetGradeLevelId: string; }) {
        if (!data.studentIds || data.studentIds.length === 0) {
            throw new BadRequestException('No students selected for promotion.');
        }

        return this.prisma.$transaction(async (tx) => {
            // Update old historical records to PROMOTED
            await tx.enrollment.updateMany({
                where: {
                    studentId: { in: data.studentIds },
                    academicYearId: data.sourceAcademicYearId
                },
                data: {
                    status: 'PROMOTED'
                }
            });

            // Rollover: Create NEW fresh enrollments for the next target year
            await tx.enrollment.createMany({
                data: data.studentIds.map(studentId => ({
                    studentId,
                    academicYearId: data.targetAcademicYearId,
                    gradeLevelId: data.targetGradeLevelId,
                    status: 'ACTIVE'
                })),
                skipDuplicates: true
            });

            // Update the master student profiles to point to the new grade level
            await tx.studentProfile.updateMany({
                where: {
                    id: { in: data.studentIds }
                },
                data: {
                    gradeLevelId: data.targetGradeLevelId,
                    sectionId: null, // Strip their section so they can be assigned later
                    enrollmentStatus: 'ACTIVE'
                }
            });

            return { promotedCount: data.studentIds.length };
        });
    }
}
