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
import { GroupChatsService } from '../group-chats/group-chats.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Map userId to socketId
    private connectedUsers = new Map<string, string>();

    constructor(
        private jwtService: JwtService,
        private messagesService: MessagesService,
        private groupChatsService: GroupChatsService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const authHeader = client.handshake.headers['authorization'] || client.handshake.headers['Authorization'];
            let token = client.handshake.auth?.token;

            if (!token && typeof authHeader === 'string') {
                token = authHeader.split(' ')[1];
            }

            if (!token) throw new Error('No token provided');

            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_ACCESS_SECRET || 'dev_secret_key',
            });

            const userId = payload.sub;
            this.connectedUsers.set(userId, client.id);

            // Join a personal room for direct messages
            client.join(userId);

            // Join group chat rooms
            const groupChats = await this.groupChatsService.getUserGroupChats(userId);
            for (const chat of groupChats) {
                client.join(`chat_${chat.id}`);
            }

            console.log(`Client connected: ${client.id} (User: ${userId})`);
        } catch (error) {
            console.error('WebSocket Authentication failed', error.message);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        for (const [userId, socketId] of this.connectedUsers.entries()) {
            if (socketId === client.id) {
                this.connectedUsers.delete(userId);
                break;
            }
        }
    }

    @SubscribeMessage('sendDirectMessage')
    async handleDirectMessage(
        @MessageBody() data: { recipientId: string; body: string },
        @ConnectedSocket() client: Socket,
    ) {
        let senderId: string = '';
        for (const [uId, sId] of this.connectedUsers.entries()) {
            if (sId === client.id) senderId = uId;
        }

        if (senderId) {
            const message = await this.messagesService.sendMessage(senderId, data.recipientId, data.body);

            this.server.to(data.recipientId).emit('newDirectMessage', message);
            this.server.to(senderId).emit('newDirectMessage', message);
        }
    }

    @SubscribeMessage('sendGroupMessage')
    async handleGroupMessage(
        @MessageBody() data: { chatId: string; body: string; attachments?: string[] },
        @ConnectedSocket() client: Socket,
    ) {
        let senderId: string = '';
        for (const [uId, sId] of this.connectedUsers.entries()) {
            if (sId === client.id) senderId = uId;
        }

        if (senderId) {
            const message = await this.groupChatsService.sendMessage(data.chatId, senderId, data.body, data.attachments);

            this.server.to(`chat_${data.chatId}`).emit('newGroupMessage', message);
        }
    }
}
