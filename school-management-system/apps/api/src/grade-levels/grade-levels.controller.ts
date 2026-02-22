import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { GradeLevelsService } from './grade-levels.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SchoolLevel } from '@sms/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grade-levels')
export class GradeLevelsController {
    constructor(private readonly gradeLevelsService: GradeLevelsService) { }

    @Roles('ADMIN')
    @Post()
    async create(@Body() body: { name: string; schoolLevel: SchoolLevel }) {
        return {
            success: true,
            data: await this.gradeLevelsService.create(body),
        };
    }

    @Get()
    async findAll() {
        return {
            success: true,
            data: await this.gradeLevelsService.findAll(),
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return {
            success: true,
            data: await this.gradeLevelsService.findOne(id),
        };
    }
}
