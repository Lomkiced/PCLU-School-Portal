import { Controller, Get, Post, Body, Param, Patch, UseGuards, Put } from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAcademicYearDto } from './dto/academic-year.dto';
import { BulkCreateGradingPeriodsDto } from './dto/grading-period.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic-years')
export class AcademicYearsController {
    constructor(private readonly academicYearsService: AcademicYearsService) { }

    @Roles('ADMIN')
    @Post()
    async create(@Body() body: CreateAcademicYearDto) {
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
    @Post(':id/activate')
    async activate(@Param('id') id: string) {
        return {
            success: true,
            data: await this.academicYearsService.activate(id),
        };
    }

    @Roles('ADMIN')
    @Post(':id/close')
    async close(@Param('id') id: string) {
        return {
            success: true,
            data: await this.academicYearsService.close(id),
        };
    }

    @Roles('ADMIN')
    @Put(':id/grading-periods')
    async updateGradingPeriods(
        @Param('id') id: string,
        @Body() body: BulkCreateGradingPeriodsDto
    ) {
        return {
            success: true,
            data: await this.academicYearsService.updateGradingPeriods(id, body),
        };
    }
}

