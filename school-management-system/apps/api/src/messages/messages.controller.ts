import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    /** GET /messages/conversations — all conversations for the current user */
    @Get('conversations')
    async getConversations(@CurrentUser() user: any) {
        return {
            success: true,
            data: await this.messagesService.getUserConversations(user.sub),
        };
    }

    /** POST /messages/conversations/direct — get or create a DM conversation */
    // NOTE: Must be defined BEFORE the :id route to avoid NestJS treating "direct" as an :id param
    @Post('conversations/direct')
    async getOrCreateDirect(
        @Body() body: { recipientId: string },
        @CurrentUser() user: any,
    ) {
        return {
            success: true,
            data: await this.messagesService.getOrCreateDirectConversation(user.sub, body.recipientId),
        };
    }

    /** GET /messages/users/search?q=... — search users for new message */
    @Get('users/search')
    async searchUsers(@Query('q') query: string, @CurrentUser() user: any) {
        return {
            success: true,
            data: await this.messagesService.searchUsers(query, user.sub),
        };
    }

    /** PATCH /messages/conversations/:id/read — mark conversation as read */
    @Patch('conversations/:id/read')
    async markAsRead(@Param('id') conversationId: string, @CurrentUser() user: any) {
        return {
            success: true,
            data: await this.messagesService.markAsRead(user.sub, conversationId),
        };
    }

    /** GET /messages/conversations/:id — paginated message history */
    // NOTE: Wildcard param route must be LAST to avoid catching named routes
    @Get('conversations/:id')
    async getConversationMessages(
        @Param('id') conversationId: string,
        @Query('cursor') cursor: string,
        @Query('limit') limit: string,
        @CurrentUser() user: any,
    ) {
        return {
            success: true,
            data: await this.messagesService.getConversationMessages(
                conversationId,
                user.sub,
                cursor || undefined,
                limit ? parseInt(limit, 10) : 50,
            ),
        };
    }
}
