import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Get('inbox')
    async getInbox(@CurrentUser() user: any) {
        return {
            success: true,
            data: await this.messagesService.getInbox(user.sub)
        };
    }

    @Get('conversation/:userId')
    async getConversation(@Param('userId') partnerId: string, @CurrentUser() user: any) {
        return {
            success: true,
            data: await this.messagesService.getConversation(user.sub, partnerId)
        };
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string) {
        return {
            success: true,
            data: await this.messagesService.markAsRead(id)
        };
    }
}
