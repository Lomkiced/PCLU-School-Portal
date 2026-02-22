import { Controller, Get, Post, Body, Param, Query, Delete, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@sms/database';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lms/content')
export class ContentController {
    constructor(private readonly contentService: ContentService) { }

    @Roles('ADMIN', 'TEACHER')
    @Post()
    async create(@Body() body: any) {
        return {
            success: true,
            data: await this.contentService.create(body),
            message: 'LMS Content created successfully'
        };
    }

    @Roles('ADMIN', 'TEACHER', 'STUDENT')
    @Get()
    async findAll(@Query('sectionId') sectionId: string, @Query('subjectId') subjectId: string) {
        return {
            success: true,
            data: await this.contentService.findAll(sectionId, subjectId)
        };
    }

    @Roles('ADMIN', 'TEACHER', 'STUDENT')
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return {
            success: true,
            data: await this.contentService.findOne(id)
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Delete(':id')
    async delete(@Param('id') id: string) {
        return {
            success: true,
            data: await this.contentService.delete(id),
            message: 'LMS Content deleted'
        };
    }
}
