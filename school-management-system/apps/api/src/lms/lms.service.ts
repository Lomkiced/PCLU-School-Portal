import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LmsService {
    constructor(private readonly prisma: PrismaService) { }

    async getCourseBySubject(subjectId: string, user: any) {
        // Find the course for this subject
        let course = await this.prisma.course.findFirst({
            where: { subjectId },
            include: {
                subject: true,
                modules: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        items: {
                            orderBy: { orderIndex: 'asc' },
                        },
                    },
                },
            },
        });

        if (!course) {
            // If the user is a teacher, let's auto-create the course for them
            if (user.role === 'TEACHER') {
                const teacherProfile = await this.prisma.teacherProfile.findUnique({
                    where: { userId: user.id }
                });

                // Find the first section this teacher handles for this subject
                // to get the gradeLevelId required to create the course
                const sectionSubject = await this.prisma.sectionSubject.findFirst({
                    where: {
                        teacherId: teacherProfile?.id,
                        subjectId: subjectId
                    },
                    include: { section: true }
                });

                if (teacherProfile && sectionSubject) {
                    const newCourse = await this.prisma.course.create({
                        data: {
                            subjectId,
                            teacherId: teacherProfile.id,
                            gradeLevelId: sectionSubject.section.gradeLevelId
                        }
                    });

                    // Fetch the newly created course with the required relations mapping
                    course = await this.prisma.course.findUnique({
                        where: { id: newCourse.id },
                        include: {
                            subject: true,
                            modules: {
                                orderBy: { orderIndex: 'asc' },
                                include: {
                                    items: {
                                        orderBy: { orderIndex: 'asc' },
                                    },
                                },
                            },
                        },
                    });
                } else {
                    throw new NotFoundException(`Course not found for subject ${subjectId} and cannot be auto-created.`);
                }
            } else {
                // If it's a student, return 404 because teachers should create courses first
                throw new NotFoundException(`Course not found for subject ${subjectId}`);
            }
        }

        return course;
    }

    async createModule(data: { courseId: string; title: string; description?: string }) {
        // Determine next orderIndex
        const aggregations = await this.prisma.module.aggregate({
            where: { courseId: data.courseId },
            _max: { orderIndex: true },
        });

        const nextOrder = (aggregations._max.orderIndex ?? -1) + 1;

        return this.prisma.module.create({
            data: {
                courseId: data.courseId,
                title: data.title,
                description: data.description,
                orderIndex: nextOrder,
            },
        });
    }

    async createItem(moduleId: string, data: { title: string; type: any; body?: string; attachments?: any }) {
        // Determine next orderIndex
        const aggregations = await this.prisma.lMSItem.aggregate({
            where: { moduleId },
            _max: { orderIndex: true },
        });

        const nextOrder = (aggregations._max.orderIndex ?? -1) + 1;

        return this.prisma.lMSItem.create({
            data: {
                moduleId,
                title: data.title,
                type: data.type,
                body: data.body,
                attachments: data.attachments,
                orderIndex: nextOrder,
            },
        });
    }

    async reorderModules(moduleIds: string[]) {
        // Update orderIndex for each module in the array
        const updates = moduleIds.map((id, index) =>
            this.prisma.module.update({
                where: { id },
                data: { orderIndex: index },
            })
        );

        await this.prisma.$transaction(updates);
        return { message: 'Modules reordered successfully' };
    }

    async gradeSubmission(id: string, data: { score: number; feedback?: string }) {
        return this.prisma.studentSubmission.update({
            where: { id },
            data: {
                score: data.score,
                feedback: data.feedback,
            },
        });
    }
}
