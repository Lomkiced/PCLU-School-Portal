import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async getUserNotifications(@CurrentUser() user: any) {
        return {
            success: true,
            data: await this.notificationsService.getUserNotifications(user.sub)
        };
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string) {
        return {
            success: true,
            data: await this.notificationsService.markAsRead(id)
        };
    }
}
