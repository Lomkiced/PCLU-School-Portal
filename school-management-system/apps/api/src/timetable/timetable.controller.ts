import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@sms/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timetable')
export class TimetableController {
    constructor(private readonly timetableService: TimetableService) { }

    @Roles('ADMIN')
    @Post('generate')
    async generate(@Body('academicYearId') academicYearId: string) {
        return {
            success: true,
            data: await this.timetableService.generate(academicYearId),
            message: 'Timetable generated successfully'
        };
    }

    @Roles('ADMIN', 'TEACHER', 'STUDENT')
    @Get('section/:sectionId')
    async getSectionTimetable(@Param('sectionId') sectionId: string) {
        return {
            success: true,
            data: await this.timetableService.getSectionTimetable(sectionId)
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Get('teacher/:teacherId')
    async getTeacherTimetable(@Param('teacherId') teacherId: string) {
        return {
            success: true,
            data: await this.timetableService.getTeacherTimetable(teacherId)
        };
    }

    @Roles('ADMIN')
    @Get('room/:roomId')
    async getRoomTimetable(@Param('roomId') roomId: string) {
        return {
            success: true,
            data: await this.timetableService.getRoomTimetable(roomId)
        };
    }
}
