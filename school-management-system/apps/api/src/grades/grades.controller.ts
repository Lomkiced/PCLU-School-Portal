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
}
