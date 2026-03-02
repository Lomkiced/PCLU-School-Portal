import { Controller, Get, Post, Body, Param, UseGuards, Delete, Request } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, DayOfWeek } from '@sms/database';
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

    @Roles('ADMIN')
    @Get('all')
    async getAllTimetables() {
        return {
            success: true,
            data: await this.timetableService.getAllTimetables()
        };
    }

    @Roles('STUDENT')
    @Get('my-schedule')
    async getMyTimetable(@Request() req: any) {
        return {
            success: true,
            data: await this.timetableService.getMyTimetable(req.user.id)
        };
    }

    @Roles('ADMIN')
    @Post('timeslot/:id')
    async updateTimeslot(
        @Param('id') id: string,
        @Body() body: { dayOfWeek: DayOfWeek, startTime: string, endTime: string, roomId: string, teacherId?: string }
    ) {
        return {
            success: true,
            data: await this.timetableService.updateTimeslot(id, body)
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Post('sections/:sectionId')
    async createTimeslot(
        @Param('sectionId') sectionId: string,
        @Body() body: { dayOfWeek: any, startTime: string, endTime: string, subjectId: string, teacherId: string, roomId: string, academicYearId: string }
    ) {
        return {
            success: true,
            data: await this.timetableService.createTimeslot(sectionId, body),
            message: 'Timeslot created successfully'
        };
    }

    @Roles('ADMIN')
    @Delete('timeslot/:id')
    async deleteTimeslot(@Param('id') id: string) {
        await this.timetableService.deleteTimeslot(id);
        return {
            success: true,
            message: 'Timeslot deleted successfully'
        };
    }
}
