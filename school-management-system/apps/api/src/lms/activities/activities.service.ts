import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActivitiesService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.activity.create({
            data: {
                title: data.title,
                description: data.description,
                attachments: data.attachments || [],
                teacherId: data.teacherId,
                subjectId: data.subjectId,
                sectionId: data.sectionId,
                dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
            }
        });
    }

    async submitActivity(activityId: string, studentId: string, fileUrls: string[]) {
        return this.prisma.activitySubmission.create({
            data: {
                activityId,
                studentId,
                fileUrls
            }
        });
    }

    async gradeActivity(submissionId: string, data: { grade: number; feedback?: string }) {
        return this.prisma.activitySubmission.update({
            // We assume ID might be integer or string depending on schema. Let's cast to what Prisma expects.
            where: { id: submissionId },
            data: {
                grade: data.grade,
                feedback: data.feedback
            }
        });
    }

    async findAll(sectionId: string, subjectId: string) {
        return this.prisma.activity.findMany({
            where: { sectionId, subjectId },
            include: { submissions: true }
        });
    }
}
