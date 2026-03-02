import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
    private readonly logger = new Logger(MessagesService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Get all conversations for a user, with latest message and participant info.
     */
    async getUserConversations(userId: string) {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                participants: { some: { userId } },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                role: true,
                                profilePicture: true,
                                studentProfile: { select: { firstName: true, lastName: true } },
                                teacherProfile: { select: { firstName: true, lastName: true } },
                                adminProfile: { select: { firstName: true, lastName: true } },
                                parentProfile: { select: { firstName: true, lastName: true } },
                            },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                email: true,
                                role: true,
                                profilePicture: true,
                                studentProfile: { select: { firstName: true, lastName: true } },
                                teacherProfile: { select: { firstName: true, lastName: true } },
                                adminProfile: { select: { firstName: true, lastName: true } },
                                parentProfile: { select: { firstName: true, lastName: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Attach unread count for each conversation
        return Promise.all(
            conversations.map(async (conv) => {
                const participant = conv.participants.find((p) => p.userId === userId);
                const unreadCount = await this.prisma.message.count({
                    where: {
                        conversationId: conv.id,
                        createdAt: { gt: participant?.lastReadAt ?? new Date(0) },
                        senderId: { not: userId },
                        isDeleted: false,
                    },
                });
                return { ...conv, unreadCount };
            }),
        );
    }

    /**
     * Get paginated message history for a conversation.
     */
    async getConversationMessages(
        conversationId: string,
        userId: string,
        cursor?: string,
        limit = 50,
    ) {
        // Verify user is a participant
        const participant = await this.prisma.conversationParticipant.findUnique({
            where: { userId_conversationId: { userId, conversationId } },
        });
        if (!participant) {
            throw new ForbiddenException('You are not a participant in this conversation');
        }

        const where = {
            conversationId,
            isDeleted: false,
        };

        const messages = await this.prisma.message.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        profilePicture: true,
                        studentProfile: { select: { firstName: true, lastName: true } },
                        teacherProfile: { select: { firstName: true, lastName: true } },
                        adminProfile: { select: { firstName: true, lastName: true } },
                        parentProfile: { select: { firstName: true, lastName: true } },
                    },
                },
            },
        });

        const hasMore = messages.length > limit;
        const data = hasMore ? messages.slice(0, limit) : messages;

        return {
            messages: data.reverse(), // Oldest first for display
            nextCursor: hasMore ? data[0]?.id : null,
        };
    }

    /**
     * Create a new message in a conversation.
     */
    async createMessage(
        conversationId: string,
        senderId: string,
        content: string,
        attachmentUrl?: string,
    ) {
        // Verify sender is a participant
        const participant = await this.prisma.conversationParticipant.findUnique({
            where: { userId_conversationId: { userId: senderId, conversationId } },
        });
        if (!participant) {
            throw new ForbiddenException('You are not a participant in this conversation');
        }
        if (participant.role === 'MUTED') {
            throw new ForbiddenException('You are muted in this conversation');
        }

        const message = await this.prisma.message.create({
            data: {
                conversationId,
                senderId,
                content,
                attachmentUrl,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        profilePicture: true,
                        studentProfile: { select: { firstName: true, lastName: true } },
                        teacherProfile: { select: { firstName: true, lastName: true } },
                        adminProfile: { select: { firstName: true, lastName: true } },
                        parentProfile: { select: { firstName: true, lastName: true } },
                    },
                },
            },
        });

        // Update conversation's updatedAt
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        // Update sender's lastReadAt
        await this.prisma.conversationParticipant.update({
            where: { userId_conversationId: { userId: senderId, conversationId } },
            data: { lastReadAt: new Date() },
        });

        return message;
    }

    /**
     * Get or create a direct conversation between two users.
     */
    async getOrCreateDirectConversation(userId1: string, userId2: string) {
        this.logger.log(`getOrCreateDirectConversation: userId1=${userId1}, userId2=${userId2}`);

        try {
            // Find existing DIRECT conversation
            const isSelfChat = userId1 === userId2;

            let existing;

            if (isSelfChat) {
                // For self-chats, find a direct conversation where ALL participants are just this user
                existing = await this.prisma.conversation.findFirst({
                    where: {
                        type: 'DIRECT',
                        participants: {
                            every: { userId: userId1 } // No other users allowed
                        }
                    },
                    include: {
                        participants: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        email: true,
                                        role: true,
                                        profilePicture: true,
                                        studentProfile: { select: { firstName: true, lastName: true } },
                                        teacherProfile: { select: { firstName: true, lastName: true } },
                                        adminProfile: { select: { firstName: true, lastName: true } },
                                        parentProfile: { select: { firstName: true, lastName: true } },
                                    },
                                },
                            },
                        },
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                });
            } else {
                // For normal DMs, find where both users are participants
                existing = await this.prisma.conversation.findFirst({
                    where: {
                        type: 'DIRECT',
                        AND: [
                            { participants: { some: { userId: userId1 } } },
                            { participants: { some: { userId: userId2 } } },
                        ],
                    },
                    include: {
                        participants: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        email: true,
                                        role: true,
                                        profilePicture: true,
                                        studentProfile: { select: { firstName: true, lastName: true } },
                                        teacherProfile: { select: { firstName: true, lastName: true } },
                                        adminProfile: { select: { firstName: true, lastName: true } },
                                        parentProfile: { select: { firstName: true, lastName: true } },
                                    },
                                },
                            },
                        },
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                });
            }

            if (existing) return existing;

            // Create new DIRECT conversation
            return this.prisma.conversation.create({
                data: {
                    type: 'DIRECT',
                    participants: {
                        create: isSelfChat
                            ? [{ userId: userId1 }]
                            : [{ userId: userId1 }, { userId: userId2 }],
                    },
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    role: true,
                                    profilePicture: true,
                                    studentProfile: { select: { firstName: true, lastName: true } },
                                    teacherProfile: { select: { firstName: true, lastName: true } },
                                    adminProfile: { select: { firstName: true, lastName: true } },
                                    parentProfile: { select: { firstName: true, lastName: true } },
                                },
                            },
                        },
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
            });
        } catch (error) {
            this.logger.error(`Failed to get/create direct conversation: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`Failed to create conversation: ${error.message}`);
        }
    }

    /**
     * Search users for the "New Message" dialog.
     */
    async searchUsers(query: string, currentUserId: string) {
        if (!query || query.trim().length < 2) return [];

        const q = query.trim();

        return this.prisma.user.findMany({
            where: {
                id: { not: currentUserId },
                OR: [
                    { email: { contains: q, mode: 'insensitive' } },
                    { studentProfile: { firstName: { contains: q, mode: 'insensitive' } } },
                    { studentProfile: { lastName: { contains: q, mode: 'insensitive' } } },
                    { teacherProfile: { firstName: { contains: q, mode: 'insensitive' } } },
                    { teacherProfile: { lastName: { contains: q, mode: 'insensitive' } } },
                    { adminProfile: { firstName: { contains: q, mode: 'insensitive' } } },
                    { adminProfile: { lastName: { contains: q, mode: 'insensitive' } } },
                    { parentProfile: { firstName: { contains: q, mode: 'insensitive' } } },
                    { parentProfile: { lastName: { contains: q, mode: 'insensitive' } } },
                ],
            },
            select: {
                id: true,
                email: true,
                role: true,
                profilePicture: true,
                studentProfile: { select: { firstName: true, lastName: true } },
                teacherProfile: { select: { firstName: true, lastName: true } },
                adminProfile: { select: { firstName: true, lastName: true } },
                parentProfile: { select: { firstName: true, lastName: true } },
            },
            take: 20,
        });
    }

    /**
     * Mark a conversation as read for a user.
     */
    async markAsRead(userId: string, conversationId: string) {
        return this.prisma.conversationParticipant.update({
            where: { userId_conversationId: { userId, conversationId } },
            data: { lastReadAt: new Date() },
        });
    }

    /**
     * Automatically sync a group chat for a specific SectionSubject.
     * Finds or creates a GROUP conversation and syncs participants (Teacher + Students).
     */
    async syncSubjectGroupChat(sectionSubjectId: string) {
        this.logger.log(`Syncing group chat for SectionSubject: ${sectionSubjectId}`);

        const sectionSubject = await this.prisma.sectionSubject.findUnique({
            where: { id: sectionSubjectId },
            include: {
                teacher: true,
                subject: true,
                section: true
            }
        });

        if (!sectionSubject) {
            throw new NotFoundException('SectionSubject not found');
        }

        // 1. Find or create the corresponding Conversation
        let conversation = await this.prisma.conversation.findFirst({
            where: {
                type: 'GROUP',
                contextType: 'SUBJECT_GROUP',
                contextId: sectionSubjectId
            }
        });

        if (!conversation) {
            const title = `${sectionSubject.subject.code} - ${sectionSubject.section.name}`;
            conversation = await this.prisma.conversation.create({
                data: {
                    title,
                    type: 'GROUP',
                    contextType: 'SUBJECT_GROUP',
                    contextId: sectionSubjectId
                }
            });
        }

        // 2. Fetch all valid enrollments (exclude DROPPED)
        const enrollments = await this.prisma.subjectEnrollment.findMany({
            where: {
                subjectId: sectionSubject.subjectId,
                sectionId: sectionSubject.sectionId,
                academicYearId: sectionSubject.academicYearId,
                status: { not: 'DROPPED' }
            },
            include: { student: true }
        });

        // 3. Determine expected user IDs
        const expectedUserIds = new Set<string>();

        if (sectionSubject.teacher?.userId) {
            expectedUserIds.add(sectionSubject.teacher.userId);
        }

        for (const enr of enrollments) {
            if (enr.student?.userId) {
                expectedUserIds.add(enr.student.userId);
            }
        }

        // 4. Fetch current participants
        const currentParticipants = await this.prisma.conversationParticipant.findMany({
            where: { conversationId: conversation.id }
        });

        const currentUserIds = new Set(currentParticipants.map(p => p.userId));

        // 5. Calculate diffs
        const toAdd = Array.from(expectedUserIds).filter(id => !currentUserIds.has(id));
        const toRemove = Array.from(currentUserIds).filter(id => !expectedUserIds.has(id));

        // 6. Apply diffs
        if (toAdd.length > 0) {
            await this.prisma.conversationParticipant.createMany({
                data: toAdd.map(userId => ({
                    conversationId: conversation!.id,
                    userId: userId,
                    role: sectionSubject.teacher?.userId === userId ? 'ADMIN' : 'MEMBER'
                }))
            });
            this.logger.log(`Added ${toAdd.length} participants to group chat ${conversation.id}`);
        }

        if (toRemove.length > 0) {
            await this.prisma.conversationParticipant.deleteMany({
                where: {
                    conversationId: conversation.id,
                    userId: { in: toRemove }
                }
            });
            this.logger.log(`Removed ${toRemove.length} participants from group chat ${conversation.id}`);
        }

        return conversation;
    }
}
