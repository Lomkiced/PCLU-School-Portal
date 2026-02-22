import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@sms/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sections')
export class SectionsController {
    constructor(private readonly sectionsService: SectionsService) { }

    @Roles('ADMIN')
    @Post()
    async create(@Body() body: any) {
        return {
            success: true,
            data: await this.sectionsService.create(body),
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Get()
    async findAll(@Query('gradeLevelId') gradeLevelId?: string) {
        return {
            success: true,
            data: await this.sectionsService.findAll(gradeLevelId),
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return {
            success: true,
            data: await this.sectionsService.findOne(id),
        };
    }
}
