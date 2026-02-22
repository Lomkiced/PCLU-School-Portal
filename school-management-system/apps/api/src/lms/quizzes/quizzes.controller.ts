import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@sms/database';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lms/quizzes')
export class QuizzesController {
    constructor(private readonly quizzesService: QuizzesService) { }

    @Roles('ADMIN', 'TEACHER')
    @Post()
    async create(@Body() body: any, @CurrentUser() user: any) {
        if (user.role === 'TEACHER') body.teacherId = user.sub; // Map appropriately
        return {
            success: true,
            data: await this.quizzesService.create(body)
        };
    }

    @Roles('STUDENT')
    @Post(':id/submit')
    async submitQuiz(
        @Param('id') quizId: string,
        @Body() body: { answers: any[] },
        @CurrentUser() user: any
    ) {
        return {
            success: true,
            data: await this.quizzesService.submitQuiz(quizId, user.sub, body.answers),
            message: 'Quiz submitted and auto-graded successfully'
        };
    }

    @Roles('ADMIN', 'TEACHER', 'STUDENT')
    @Get()
    async findAll(@Query('sectionId') sectionId: string, @Query('subjectId') subjectId: string) {
        return {
            success: true,
            data: await this.quizzesService.findAll(sectionId, subjectId)
        };
    }
}
