import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { GradesService } from './grades.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@sms/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grades')
export class GradesController {
    constructor(private readonly gradesService: GradesService) { }

    @Roles('ADMIN', 'TEACHER')
    @Post()
    async saveGrade(@Body() body: any) {
        return {
            success: true,
            data: await this.gradesService.saveGrade(body),
            message: 'Grade saved successfully'
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Post(':gradeId/generate-remarks')
    async generateRemarks(@Param('gradeId') gradeId: string) {
        return {
            success: true,
            data: await this.gradesService.generateRemarks(gradeId),
            message: 'Remarks generated successfully'
        };
    }

    @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
    @Get('student/:studentId')
    async getStudentGrades(
        @Param('studentId') studentId: string,
        @Query('academicYearId') academicYearId?: string
    ) {
        return {
            success: true,
            data: await this.gradesService.getStudentGrades(studentId, academicYearId)
        };
    }

    // ==========================================
    // GRADEBOOK (ITEM GRADES)
    // ==========================================

    @Roles('ADMIN', 'TEACHER')
    @Get('grid/:sectionId/:subjectId')
    async getGradebookGrid(
        @Param('sectionId') sectionId: string,
        @Param('subjectId') subjectId: string,
        @Query('academicYearId') academicYearId: string
    ) {
        return {
            success: true,
            data: await this.gradesService.getGradebookGrid(sectionId, subjectId, academicYearId)
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Post('upsert')
    async upsertItemGrade(@Body() body: { studentId: string; gradeItemId: string; score: number; remarks?: string }) {
        return {
            success: true,
            data: await this.gradesService.upsertItemGrade(body),
            message: 'Grade item saved successfully'
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Post('category')
    async addGradeCategory(@Body() body: { sectionId: string; subjectId: string; academicYearId: string; name: string; weight: number }) {
        return {
            success: true,
            data: await this.gradesService.addGradeCategory(body),
            message: 'Grade category added successfully'
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Post('item')
    async addGradeItem(@Body() body: { categoryId: string; name: string; maxScore: number; date?: string }) {
        return {
            success: true,
            data: await this.gradesService.addGradeItem(body),
            message: 'Grade item added successfully'
        };
    }
}
