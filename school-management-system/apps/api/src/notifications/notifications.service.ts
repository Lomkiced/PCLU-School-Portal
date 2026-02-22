import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private prisma: PrismaService) {
        if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    }),
                });
                this.logger.log('Firebase Admin initialized');
            } catch (e) {
                this.logger.error('Failed to initialize Firebase Admin', e);
            }
        }
    }

    async sendPushNotification(userIds: string[], title: string, body: string, data?: any) {
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds }, fcmToken: { not: null } },
            select: { fcmToken: true }
        });

        const tokens = users.map(u => u.fcmToken).filter(t => t) as string[];

        if (tokens.length > 0 && admin.apps.length > 0) {
            try {
                await admin.messaging().sendEachForMulticast({
                    tokens,
                    notification: { title, body },
                    data: data || {},
                });
            } catch (e) {
                this.logger.error('FCM multicase send failed', e);
            }
        }

        const notifs = userIds.map(userId => ({
            userId,
            title,
            body,
            type: data?.type || 'GENERAL',
            referenceId: data?.referenceId
        }));

        if (notifs.length > 0) {
            await this.prisma.notification.createMany({ data: notifs });
        }
    }

    async getUserNotifications(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }

    async markAsRead(notificationId: string) {
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });
    }
}
