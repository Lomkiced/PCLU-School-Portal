import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupChatsService {
    constructor(private prisma: PrismaService) { }

    async createGroupChat(name: string, sectionId?: string, memberIds: string[] = []) {
        return this.prisma.groupChat.create({
            data: {
                name,
                sectionId,
                members: {
                    create: memberIds.map(id => ({ userId: id }))
                }
            }
        });
    }

    async sendMessage(chatId: string, senderId: string, body: string, attachments: string[] = []) {
        return this.prisma.groupChatMessage.create({
            data: { chatId, senderId, body, attachments }
        });
    }

    async getGroupChatMessages(chatId: string) {
        return this.prisma.groupChatMessage.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' }
        });
    }

    async getUserGroupChats(userId: string) {
        return this.prisma.groupChat.findMany({
            where: {
                members: { some: { userId } }
            },
            include: { _count: { select: { members: true } } }
        });
    }
}
