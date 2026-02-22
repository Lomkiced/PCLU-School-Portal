import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@sms/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) { }

    @Roles('ADMIN', 'TEACHER')
    @Post()
    async markAttendance(@Body() body: any, @CurrentUser() user: any) {
        // Determine the teacher Profile ID based on the logged-in user
        // In a real app, you'd lookup teacherProfile.id. 
        // Here we'll just pass user.sub and let the service handle or store the user ID.
        body.scannedBy = user.sub;

        return {
            success: true,
            data: await this.attendanceService.markAttendance(body),
            message: 'Attendance recorded successfully'
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Get('section/:sectionId')
    async getSectionAttendance(
        @Param('sectionId') sectionId: string,
        @Query('date') date: string
    ) {
        return {
            success: true,
            data: await this.attendanceService.getSectionAttendance(sectionId, date)
        };
    }
}
