import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LmsService {
    constructor(private readonly prisma: PrismaService) { }

    async getCourseBySubject(subjectId: string) {
        // Find the course for this subject
        let course = await this.prisma.course.findFirst({
            where: { subjectId },
            include: {
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
            // If no course exists but the subject does, return 404 or an empty structure
            // For now, return 404
            throw new NotFoundException(`Course not found for subject ${subjectId}`);
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
