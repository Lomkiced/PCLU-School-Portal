import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../messages/messages.service';

interface AuthenticatedSocket extends Socket {
    userId?: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Map userId → socketId(s)
    private connectedUsers = new Map<string, Set<string>>();

    constructor(
        private jwtService: JwtService,
        private messagesService: MessagesService,
    ) { }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            const authHeader =
                client.handshake.headers['authorization'] ||
                client.handshake.headers['Authorization'];
            let token = client.handshake.auth?.token;

            if (!token && typeof authHeader === 'string') {
                token = authHeader.split(' ')[1];
            }

            if (!token) throw new Error('No token provided');

            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_ACCESS_SECRET || 'dev_secret_key',
            });

            const userId = payload.sub;
            client.userId = userId;

            // Track connected sockets (support multiple tabs)
            if (!this.connectedUsers.has(userId)) {
                this.connectedUsers.set(userId, new Set());
            }
            this.connectedUsers.get(userId)!.add(client.id);

            // Join personal room
            client.join(`user_${userId}`);

            // Join all conversation rooms the user belongs to
            const conversations = await this.messagesService.getUserConversations(userId);
            for (const conv of conversations) {
                client.join(`conversation_${conv.id}`);
            }

            console.log(`Client connected: ${client.id} (User: ${userId})`);
        } catch (error) {
            console.error('WebSocket Authentication failed', error.message);
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        if (client.userId) {
            const sockets = this.connectedUsers.get(client.userId);
            if (sockets) {
                sockets.delete(client.id);
                if (sockets.size === 0) {
                    this.connectedUsers.delete(client.userId);
                }
            }
        }
    }

    @SubscribeMessage('join-conversation')
    async handleJoinConversation(
        @MessageBody() data: { conversationId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        if (!client.userId) return;
        client.join(`conversation_${data.conversationId}`);
        client.emit('joined-conversation', { conversationId: data.conversationId });
    }

    @SubscribeMessage('send-message')
    async handleSendMessage(
        @MessageBody()
        data: { conversationId: string; content: string; attachmentUrl?: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        if (!client.userId) return;

        try {
            const message = await this.messagesService.createMessage(
                data.conversationId,
                client.userId,
                data.content,
                data.attachmentUrl,
            );

            // Broadcast to all participants in the conversation room
            this.server
                .to(`conversation_${data.conversationId}`)
                .emit('new-message', message);
        } catch (error) {
            client.emit('message-error', { error: error.message });
        }
    }

    @SubscribeMessage('mark-read')
    async handleMarkRead(
        @MessageBody() data: { conversationId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        if (!client.userId) return;

        try {
            await this.messagesService.markAsRead(client.userId, data.conversationId);
            client.emit('marked-read', { conversationId: data.conversationId });
        } catch (error) {
            client.emit('message-error', { error: error.message });
        }
    }
}
