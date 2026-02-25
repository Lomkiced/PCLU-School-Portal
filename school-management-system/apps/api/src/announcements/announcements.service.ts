import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnnouncementPriority, AnnouncementStatus, Role } from '@sms/database';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
    constructor(
        private prisma: PrismaService,
        private notifications: NotificationsService
    ) { }

    async create(data: CreateAnnouncementDto & { authorId: string }) {
        const announcement = await this.prisma.announcement.create({
            data: {
                title: data.title,
                content: data.content,
                priority: data.priority,
                status: data.status,
                targetRoles: data.targetRoles || [],
                targetGradeLevels: data.targetGradeLevels || [],
                targetSections: data.targetSections || [],
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
                publishedAt: data.publishedAt ? new Date(data.publishedAt) : (data.status === 'PUBLISHED' ? new Date() : null),
                authorId: data.authorId,
            }
        });

        if (data.status === 'PUBLISHED') {
            await this.notifyTargets(announcement);
        }

        return announcement;
    }

    private async notifyTargets(announcement: any) {
        // Find users matching targets
        const whereClause: any = { OR: [] };

        if (announcement.targetRoles && announcement.targetRoles.length > 0) {
            whereClause.OR.push({ role: { in: announcement.targetRoles } });
        }

        if (announcement.targetGradeLevels && announcement.targetGradeLevels.length > 0) {
            whereClause.OR.push({
                studentProfile: { gradeLevelId: { in: announcement.targetGradeLevels } }
            });
            whereClause.OR.push({
                teacherProfile: { advisoryClasses: { some: { gradeLevelId: { in: announcement.targetGradeLevels } } } }
            });
        }

        if (announcement.targetSections && announcement.targetSections.length > 0) {
            whereClause.OR.push({
                studentProfile: { sectionId: { in: announcement.targetSections } }
            });
            whereClause.OR.push({
                teacherProfile: { advisoryClasses: { some: { id: { in: announcement.targetSections } } } }
            });
        }

        let users;
        // If no targets specified, it might be for everyone. If length is 0, we assume it's public.
        if (whereClause.OR.length === 0) {
            users = await this.prisma.user.findMany({ select: { id: true } });
        } else {
            users = await this.prisma.user.findMany({ where: whereClause, select: { id: true } });
        }

        const userIds = users.map(u => u.id);

        if (userIds.length > 0) {
            this.notifications.sendPushNotification(
                userIds,
                `New Announcement: ${announcement.title}`,
                announcement.content.replace(/(<([^>]+)>)/gi, "").substring(0, 50) + '...',
                { type: 'NEW_ANNOUNCEMENT', referenceId: announcement.id }
            ).catch(e => console.error("Failed to send push", e));
        }
    }

    async findAllPublic() {
        return this.prisma.announcement.findMany({
            where: {
                status: 'PUBLISHED',
                targetRoles: { isEmpty: true },
                targetGradeLevels: { isEmpty: true },
                targetSections: { isEmpty: true },
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            orderBy: { publishedAt: 'desc' },
            include: { author: { select: { email: true, role: true } } }
        });
    }

    async findAllTargeted(user: any) {
        // user object from JwtStrategy has id, role, etc. Wait, JwtStrategy returns rest of user fields.
        // so user.role is available. However, we need to know their gradeLevel/section if STUDENT.
        const userProfile = await this.prisma.user.findUnique({
            where: { id: user.id || user.sub },
            include: {
                studentProfile: true,
                teacherProfile: { include: { advisoryClasses: true } }
            }
        });

        if (!userProfile) throw new NotFoundException('User not found');

        const role = userProfile.role;

        // Admins see all announcements
        if (role === 'ADMIN') {
            return this.prisma.announcement.findMany({
                orderBy: { createdAt: 'desc' },
                include: { author: { select: { email: true, role: true } } }
            });
        }

        const gradeLevels: string[] = [];
        const sections: string[] = [];

        if (role === 'STUDENT' && userProfile.studentProfile) {
            if (userProfile.studentProfile.gradeLevelId) gradeLevels.push(userProfile.studentProfile.gradeLevelId);
            if (userProfile.studentProfile.sectionId) sections.push(userProfile.studentProfile.sectionId);
        } else if (role === 'TEACHER' && userProfile.teacherProfile) {
            userProfile.teacherProfile.advisoryClasses.forEach(s => {
                sections.push(s.id);
                gradeLevels.push(s.gradeLevelId);
            });
        }

        const targetFilters: any[] = [{ targetRoles: { isEmpty: true }, targetGradeLevels: { isEmpty: true }, targetSections: { isEmpty: true } }];

        targetFilters.push({ targetRoles: { has: role } });
        if (gradeLevels.length > 0) targetFilters.push({ targetGradeLevels: { hasSome: gradeLevels } });
        if (sections.length > 0) targetFilters.push({ targetSections: { hasSome: sections } });

        return this.prisma.announcement.findMany({
            where: {
                status: 'PUBLISHED',
                OR: targetFilters,
                AND: [
                    {
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: new Date() } }
                        ]
                    }
                ]
            },
            orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
            include: { author: { select: { email: true, role: true } } }
        });
    }

    async findOne(id: string) {
        return this.prisma.announcement.findUnique({
            where: { id },
            include: { author: { select: { email: true, role: true } } }
        });
    }

    async getAnalytics(id: string) {
        const announcement = await this.prisma.announcement.findUnique({ where: { id } });
        if (!announcement) throw new NotFoundException('Announcement not found');

        // calculate total targeted users
        const whereClause: any = { OR: [] };
        if (announcement.targetRoles && announcement.targetRoles.length > 0) {
            whereClause.OR.push({ role: { in: announcement.targetRoles } });
        }
        if (announcement.targetGradeLevels && announcement.targetGradeLevels.length > 0) {
            whereClause.OR.push({ studentProfile: { gradeLevelId: { in: announcement.targetGradeLevels } } });
            whereClause.OR.push({ teacherProfile: { advisoryClasses: { some: { gradeLevelId: { in: announcement.targetGradeLevels } } } } });
        }
        if (announcement.targetSections && announcement.targetSections.length > 0) {
            whereClause.OR.push({ studentProfile: { sectionId: { in: announcement.targetSections } } });
            whereClause.OR.push({ teacherProfile: { advisoryClasses: { some: { id: { in: announcement.targetSections } } } } });
        }

        let totalTargeted = 0;
        if (announcement.targetRoles.length === 0 && announcement.targetGradeLevels.length === 0 && announcement.targetSections.length === 0) {
            totalTargeted = await this.prisma.user.count(); // ALL
        } else {
            totalTargeted = await this.prisma.user.count({ where: whereClause });
        }

        const exactReads = await this.prisma.announcementReadReceipt.count({ where: { announcementId: id } });

        return {
            id,
            totalTargeted,
            reads: exactReads,
            viewRate: totalTargeted > 0 ? (exactReads / totalTargeted) * 100 : 0
        };
    }

    async markAsRead(id: string, userId: string) {
        // Add robust check using upsert to avoid duplicate errors
        return this.prisma.announcementReadReceipt.upsert({
            where: {
                announcementId_userId: {
                    announcementId: id,
                    userId
                }
            },
            update: {}, // do nothing if it exists
            create: {
                announcementId: id,
                userId
            }
        });
    }
}
