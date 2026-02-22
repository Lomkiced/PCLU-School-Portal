import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    async getMe(@CurrentUser() user: any) {
        return {
            success: true,
            data: await this.usersService.findOne(user.sub),
        };
    }

    @Patch('change-password')
    async changePassword(@CurrentUser() user: any, @Body() body: any) {
        return {
            success: true,
            data: await this.usersService.changePassword(user.sub, body.currentPassword, body.newPassword),
            message: 'Password changed successfully',
        };
    }

    @Patch('fcm-token')
    async updateFcmToken(@CurrentUser() user: any, @Body() body: { token: string }) {
        return {
            success: true,
            data: await this.usersService.updateFcmToken(user.sub, body.token),
        };
    }
}
