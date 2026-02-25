import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { LmsService } from './lms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('lms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LmsController {
    constructor(private readonly lmsService: LmsService) { }

    @Get('courses/:subjectId')
    @Roles('TEACHER', 'STUDENT', 'ADMIN')
    getCourse(@Param('subjectId') subjectId: string) {
        return this.lmsService.getCourseBySubject(subjectId);
    }

    @Post('modules')
    @Roles('TEACHER', 'ADMIN')
    createModule(@Body() createModuleDto: any) {
        return this.lmsService.createModule(createModuleDto);
    }

    @Patch('modules/reorder')
    @Roles('TEACHER', 'ADMIN')
    reorderModules(@Body() reorderDto: any) {
        return this.lmsService.reorderModules(reorderDto.moduleIds);
    }

    @Post('submissions/:id/grade')
    @Roles('TEACHER', 'ADMIN')
    gradeSubmission(@Param('id') id: string, @Body() gradeDto: any) {
        return this.lmsService.gradeSubmission(id, gradeDto);
    }
}
