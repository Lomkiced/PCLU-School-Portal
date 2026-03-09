import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@sms/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Controller('announcements')
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post()
    async create(@Body() createAnnouncementDto: CreateAnnouncementDto, @CurrentUser() user: any) {
        return {
            success: true,
            data: await this.announcementsService.create({
                ...createAnnouncementDto,
                authorId: user.id || user.sub
            }),
            message: 'Announcement published successfully'
        };
    }

    // Public endpoint for Landing Page (no targeting)
    @Get('public')
    async findPublic() {
        return {
            success: true,
            data: await this.announcementsService.findAllPublic()
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(@CurrentUser() user: any) {
        return {
            success: true,
            data: await this.announcementsService.findAllTargeted(user)
        };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id/analytics')
    async getAnalytics(@Param('id') id: string) {
        return {
            success: true,
            data: await this.announcementsService.getAnalytics(id)
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/read')
    async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
        return {
            success: true,
            data: await this.announcementsService.markAsRead(id, user.sub)
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return {
            success: true,
            data: await this.announcementsService.findOne(id)
        };
    }
}
