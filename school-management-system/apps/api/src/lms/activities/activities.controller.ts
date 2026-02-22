import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@sms/database';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lms/activities')
export class ActivitiesController {
    constructor(private readonly activitiesService: ActivitiesService) { }

    @Roles('ADMIN', 'TEACHER')
    @Post()
    async create(@Body() body: any, @CurrentUser() user: any) {
        if (user.role === 'TEACHER') body.teacherId = user.sub;
        return {
            success: true,
            data: await this.activitiesService.create(body),
            message: 'Activity created successfully'
        };
    }

    @Roles('STUDENT')
    @Post(':id/submit')
    async submitActivity(
        @Param('id') activityId: string,
        @Body() body: { fileUrls: string[] },
        @CurrentUser() user: any
    ) {
        return {
            success: true,
            data: await this.activitiesService.submitActivity(activityId, user.sub, body.fileUrls),
            message: 'Activity submitted successfully'
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Patch('submissions/:submissionId/grade')
    async gradeActivity(
        @Param('submissionId') submissionId: string,
        @Body() body: { grade: number; feedback?: string }
    ) {
        return {
            success: true,
            data: await this.activitiesService.gradeActivity(submissionId, body),
            message: 'Activity graded successfully'
        };
    }

    @Roles('ADMIN', 'TEACHER', 'STUDENT')
    @Get()
    async findAll(@Query('sectionId') sectionId: string, @Query('subjectId') subjectId: string) {
        return {
            success: true,
            data: await this.activitiesService.findAll(sectionId, subjectId)
        };
    }
}
