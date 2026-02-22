import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { GroupChatsService } from './group-chats.service';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('group-chats')
export class GroupChatsController {
    constructor(private readonly groupChatsService: GroupChatsService) { }

    @Post()
    async createGroupChat(@Body() body: any) {
        return {
            success: true,
            data: await this.groupChatsService.createGroupChat(body.name, body.sectionId, body.memberIds)
        };
    }

    @Get()
    async getUserGroupChats(@CurrentUser() user: any) {
        return {
            success: true,
            data: await this.groupChatsService.getUserGroupChats(user.sub)
        };
    }

    @Get(':chatId/messages')
    async getGroupChatMessages(@Param('chatId') chatId: string) {
        return {
            success: true,
            data: await this.groupChatsService.getGroupChatMessages(chatId)
        };
    }
}
