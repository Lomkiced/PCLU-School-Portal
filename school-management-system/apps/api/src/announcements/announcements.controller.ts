import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, VisibilityTarget } from '@sms/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('announcements')
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post()
    async create(@Body() body: any, @CurrentUser() user: any) {
        body.authorId = user.sub;
        return {
            success: true,
            data: await this.announcementsService.create(body),
            message: 'Announcement published successfully'
        };
    }

    // Public endpoint for Landing Page (visibility = ALL)
    @Get('public')
    async findPublic() {
        return {
            success: true,
            data: await this.announcementsService.findAll('ALL')
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(@Query('visibility') visibility?: VisibilityTarget) {
        return {
            success: true,
            data: await this.announcementsService.findAll(visibility)
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
