import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@sms/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) { }

    @Roles('ADMIN')
    @Post()
    async create(@Body() createStudentDto: any) {
        return {
            success: true,
            data: await this.studentsService.createStudent(createStudentDto),
            message: 'Student enrolled successfully'
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Get()
    async findAll(@Query('search') search: string) {
        return {
            success: true,
            data: await this.studentsService.findAll({ search })
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return {
            success: true,
            data: await this.studentsService.findOne(id)
        };
    }
}
