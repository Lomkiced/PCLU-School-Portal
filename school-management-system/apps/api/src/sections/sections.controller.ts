import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
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

    @Roles('ADMIN')
    @Post(':id/subjects')
    async addSubject(
        @Param('id') id: string,
        @Body() body: { subjectId: string; teacherId: string; academicYearId: string }
    ) {
        // In a real app we'd fetch the active academic year if not provided, 
        // but for this implementation we expect the frontend to pass it (or we hardware it for now)
        const academicYearId = body.academicYearId || (await this.sectionsService['prisma'].academicYear.findFirst({ where: { isActive: true } }))?.id;

        if (!academicYearId) throw new Error("No active academic year found");

        return {
            success: true,
            data: await this.sectionsService.addSubject(id, { ...body, academicYearId }),
            message: 'Subject assigned successfully'
        };
    }

    @Roles('ADMIN')
    @Delete(':id/subjects/:subjectId')
    async removeSubject(@Param('id') sectionId: string, @Param('subjectId') subjectId: string) {
        await this.sectionsService.removeSubject(sectionId, subjectId);
        return {
            success: true,
            message: 'Subject removed successfully'
        };
    }
}
