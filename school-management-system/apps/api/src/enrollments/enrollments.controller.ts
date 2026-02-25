import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@sms/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollments')
export class EnrollmentsController {
    constructor(private readonly enrollmentsService: EnrollmentsService) { }

    @Roles('ADMIN')
    @Post()
    async enrollStudent(@Body() body: any) {
        return {
            success: true,
            data: await this.enrollmentsService.enrollStudent(body),
            message: 'Student enrolled in subject successfully'
        };
    }

    @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
    @Get('student/:studentId')
    async getEnrollments(
        @Param('studentId') studentId: string,
        @Query('academicYearId') academicYearId?: string
    ) {
        return {
            success: true,
            data: await this.enrollmentsService.getEnrollments(studentId, academicYearId)
        };
    }

    @Roles('ADMIN')
    @Post('promote/batch')
    async promoteBatch(@Body() body: any) {
        return {
            success: true,
            data: await this.enrollmentsService.promoteBatch(body),
            message: 'Students promoted successfully'
        };
    }
}
