import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teachers')
export class TeachersController {
    constructor(private readonly teachersService: TeachersService) { }

    @Roles('ADMIN')
    @Post()
    async create(@Body() createTeacherDto: any) {
        return {
            success: true,
            data: await this.teachersService.createTeacher(createTeacherDto),
            message: 'Teacher added successfully'
        };
    }

    @Roles('ADMIN')
    @Post('add')
    async addFaculty(@Body() body: {
        firstName: string;
        lastName: string;
        email: string;
        position: string;
        departmentId: string;
    }) {
        return {
            success: true,
            data: await this.teachersService.addFaculty(body),
            message: 'Faculty member added successfully',
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Get()
    async findAll(
        @Query('search') search: string,
        @Query('departmentId') departmentId: string
    ) {
        return {
            success: true,
            data: await this.teachersService.findAll({ search, departmentId })
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return {
            success: true,
            data: await this.teachersService.findOne(id)
        };
    }
}
