import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VisibilityTarget } from '@sms/database';

@Injectable()
export class AnnouncementsService {
    constructor(
        private prisma: PrismaService,
        private notifications: NotificationsService
    ) { }

    async create(data: {
        title: string;
        body: string;
        visibility: VisibilityTarget;
        expiresAt?: string;
        authorId: string;
    }) {
        const announcement = await this.prisma.announcement.create({
            data: {
                title: data.title,
                body: data.body,
                visibility: data.visibility as any,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
                authorId: data.authorId,
                publishedAt: new Date()
            }
        });

        let userIds: string[] = [];
        if (data.visibility === 'ALL') {
            const users = await this.prisma.user.findMany({ select: { id: true } });
            userIds = users.map(u => u.id);
        } else if (data.visibility === 'STUDENTS_ONLY') {
            const users = await this.prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true } });
            userIds = users.map(u => u.id);
        } else if (data.visibility === 'TEACHERS_ONLY') {
            const users = await this.prisma.user.findMany({ where: { role: 'TEACHER' }, select: { id: true } });
            userIds = users.map(u => u.id);
        }

        if (userIds.length > 0) {
            // Typically use a Queue here to avoid blocking request, done synchronously for demo
            this.notifications.sendPushNotification(
                userIds,
                `New Announcement: ${data.title}`,
                data.body.replace(/(<([^>]+)>)/gi, "").substring(0, 50) + '...', // strip basic html from tiptap
                { type: 'ANNOUNCEMENT', referenceId: announcement.id }
            ).catch(e => console.error("Failed to send push", e));
        }

        return announcement;
    }

    async findAll(visibilityFilter?: VisibilityTarget) {
        return this.prisma.announcement.findMany({
            where: visibilityFilter ? { visibility: visibilityFilter } : undefined,
            orderBy: { publishedAt: 'desc' },
            include: { author: { select: { email: true, role: true } } }
        });
    }

    async findOne(id: string) {
        return this.prisma.announcement.findUnique({
            where: { id },
            include: { author: { select: { email: true, role: true } } }
        });
    }
}
