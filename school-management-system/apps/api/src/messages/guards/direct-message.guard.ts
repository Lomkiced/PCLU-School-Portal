import { CanActivate, ExecutionContext, ForbiddenException, Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DirectMessageGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const recipientId = request.body?.recipientId;

        if (!user) {
            return false;
        }

        if (!recipientId) {
            throw new BadRequestException('recipientId is required');
        }

        // Only enforce rule if the requester is a STUDENT
        if (user.role === 'STUDENT') {
            const recipient = await this.prisma.user.findUnique({
                where: { id: recipientId },
                select: { role: true }
            });

            if (!recipient || recipient.role !== 'TEACHER') {
                throw new ForbiddenException("You can only direct message your assigned teachers.");
            }

            // Find all active enrollments for the student
            const enrollments = await this.prisma.subjectEnrollment.findMany({
                where: {
                    student: { userId: user.id },
                    status: { not: 'DROPPED' }
                },
                select: { subjectId: true, sectionId: true, academicYearId: true }
            });

            if (enrollments.length === 0) {
                throw new ForbiddenException("You can only direct message your assigned teachers.");
            }

            // Check if any of these enrollments map to a SectionSubject taught by the target teacher
            const sharedClass = await this.prisma.sectionSubject.findFirst({
                where: {
                    teacher: { userId: recipientId },
                    OR: enrollments.map(e => ({
                        subjectId: e.subjectId,
                        sectionId: e.sectionId,
                        academicYearId: e.academicYearId
                    }))
                }
            });

            if (!sharedClass) {
                throw new ForbiddenException("You can only direct message your assigned teachers.");
            }
        }

        return true;
    }
}
