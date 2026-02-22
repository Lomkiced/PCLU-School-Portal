import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) { }

    async sendMessage(senderId: string, recipientId: string, body: string) {
        return this.prisma.message.create({
            data: { senderId, recipientId, body }
        });
    }

    async getConversation(userId1: string, userId2: string) {
        return this.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId1, recipientId: userId2 },
                    { senderId: userId2, recipientId: userId1 }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    async getInbox(userId: string) {
        const messages = await this.prisma.message.findMany({
            where: {
                OR: [{ senderId: userId }, { recipientId: userId }]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, email: true, profilePicture: true, role: true } },
                recipient: { select: { id: true, email: true, profilePicture: true, role: true } }
            }
        });

        const uniqueConversations = new Map<string, any>();
        for (const m of messages) {
            const otherUser = m.senderId === userId ? m.recipient : m.sender;
            if (!uniqueConversations.has(otherUser.id)) {
                uniqueConversations.set(otherUser.id, {
                    user: otherUser,
                    lastMessage: m
                });
            }
        }

        return Array.from(uniqueConversations.values());
    }

    async markAsRead(messageId: string) {
        return this.prisma.message.update({
            where: { id: messageId },
            data: { isRead: true }
        });
    }
}
