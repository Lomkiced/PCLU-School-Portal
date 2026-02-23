import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subjects')
export class SubjectsController {
    constructor(private readonly subjectsService: SubjectsService) { }

    @Roles('ADMIN')
    @Post()
    async create(@Body() body: {
        name: string;
        code: string;
        units: number;
        credits?: number;
        lectureHours?: number;
        labHours?: number;
        description?: string;
        subjectType: string;
        gradeLevelId?: string;
        departmentId?: string;
        prerequisiteIds?: string[];
        corequisiteIds?: string[];
    }) {
        return {
            success: true,
            data: await this.subjectsService.create(body as any),
            message: 'Subject created successfully',
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

    @Roles('ADMIN', 'TEACHER')
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return {
            success: true,
            data: await this.subjectsService.findOne(id),
        };
    }

    @Roles('ADMIN')
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() body: {
            name?: string;
            code?: string;
            units?: number;
            credits?: number;
            lectureHours?: number;
            labHours?: number;
            description?: string;
            subjectType?: string;
            gradeLevelId?: string;
            departmentId?: string;
            prerequisiteIds?: string[];
            corequisiteIds?: string[];
        },
    ) {
        return {
            success: true,
            data: await this.subjectsService.update(id, body as any),
            message: 'Subject updated successfully',
        };
    }

    @Roles('ADMIN')
    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.subjectsService.remove(id);
        return {
            success: true,
            message: 'Subject deleted successfully',
        };
    }
}
