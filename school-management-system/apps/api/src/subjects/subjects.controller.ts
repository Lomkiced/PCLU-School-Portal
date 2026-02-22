import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@sms/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subjects')
export class SubjectsController {
    constructor(private readonly subjectsService: SubjectsService) { }

    @Roles('ADMIN')
    @Post()
    async create(@Body() body: any) {
        return {
            success: true,
            data: await this.subjectsService.create(body),
        };
    }

    @Roles('ADMIN', 'TEACHER', 'STUDENT')
    @Get()
    async findAll() {
        return {
            success: true,
            data: await this.subjectsService.findAll(),
        };
    }
}
