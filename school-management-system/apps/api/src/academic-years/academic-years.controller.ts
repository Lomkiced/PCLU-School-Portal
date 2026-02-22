import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@sms/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic-years')
export class AcademicYearsController {
    constructor(private readonly academicYearsService: AcademicYearsService) { }

    @Roles('ADMIN')
    @Post()
    async create(@Body() body: any) {
        return {
            success: true,
            data: await this.academicYearsService.create(body),
        };
    }

    @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
    @Get()
    async findAll() {
        return {
            success: true,
            data: await this.academicYearsService.findAll(),
        };
    }

    @Roles('ADMIN')
    @Patch(':id/active')
    async setActive(@Param('id') id: string) {
        return {
            success: true,
            data: await this.academicYearsService.setActive(id),
        };
    }
}
