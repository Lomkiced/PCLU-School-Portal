import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) { }

    @Roles('ADMIN')
    @Post()
    async create(@Body() body: {
        student: { firstName: string; lastName: string; email: string; gender: string };
        parent: { firstName: string; lastName: string; occupation: string; contactNumber: string };
    }) {
        return {
            success: true,
            data: await this.studentsService.createStudentWithParent(body),
            message: 'Student and parent accounts created successfully',
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Get()
    async findAll(@Query('search') search?: string) {
        return {
            success: true,
            data: await this.studentsService.findAll({ search }),
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Get('enrolled')
    async findEnrolled(@Query('search') search?: string) {
        return {
            success: true,
            data: await this.studentsService.findEnrolled({ search }),
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Get('unenrolled')
    async findUnenrolled(@Query('search') search?: string) {
        return {
            success: true,
            data: await this.studentsService.findUnenrolled({ search }),
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return {
            success: true,
            data: await this.studentsService.findOne(id),
        };
    }

    @Roles('ADMIN')
    @Post(':id/enroll')
    async enroll(
        @Param('id') id: string,
        @Body() body: { gradeLevelId: string; sectionId: string },
    ) {
        return {
            success: true,
            data: await this.studentsService.enrollStudent({
                studentId: id,
                gradeLevelId: body.gradeLevelId,
                sectionId: body.sectionId,
            }),
            message: 'Student enrolled successfully',
        };
    }
}
