import { Controller, Get, Post, Delete, Body, Param, Query, Patch, UseGuards, Req } from '@nestjs/common';
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

    @Roles('ADMIN', 'TEACHER', 'STUDENT')
    @Get(':id/subjects')
    async getSubjects(
        @Param('id') id: string,
        @Query('academicYearId') academicYearId?: string
    ) {
        return {
            success: true,
            data: await this.sectionsService.getInheritedSubjects(id, academicYearId),
        };
    }

    @Roles('ADMIN')
    @Patch(':id/subjects/:subjectId')
    async assignTeacher(
        @Param('id') id: string,
        @Param('subjectId') subjectId: string,
        @Body() body: { teacherId: string; academicYearId?: string }
    ) {
        let academicYearId = body.academicYearId;
        if (!academicYearId) {
            const ay = await this.sectionsService['prisma'].academicYear.findFirst({ where: { status: 'ACTIVE' } });
            if (!ay) throw new Error("No active academic year found");
            academicYearId = ay.id;
        }

        return {
            success: true,
            data: await this.sectionsService.assignTeacher(id, subjectId, { teacherId: body.teacherId, academicYearId }),
            message: 'Teacher assigned to subject successfully'
        };
    }
}
