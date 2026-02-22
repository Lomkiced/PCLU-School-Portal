import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@sms/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) { }

    @Roles('ADMIN')
    @Post()
    async create(@Body() body: { name: string; headTeacherId?: string }) {
        return {
            success: true,
            data: await this.departmentsService.create(body)
        };
    }

    @Roles('ADMIN', 'TEACHER')
    @Get()
    async findAll() {
        return {
            success: true,
            data: await this.departmentsService.findAll()
        };
    }
}
