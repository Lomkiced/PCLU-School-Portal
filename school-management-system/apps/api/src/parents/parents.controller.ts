import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ParentsService } from './parents.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@sms/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parents')
export class ParentsController {
    constructor(private readonly parentsService: ParentsService) { }

    @Roles('ADMIN')
    @Post()
    async create(@Body() createParentDto: any) {
        return {
            success: true,
            data: await this.parentsService.createParent(createParentDto),
            message: 'Parent added successfully'
        };
    }

    @Roles('ADMIN')
    @Get()
    async findAll(@Query('search') search: string) {
        return {
            success: true,
            data: await this.parentsService.findAll({ search })
        };
    }

    @Roles('ADMIN', 'PARENT')
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return {
            success: true,
            data: await this.parentsService.findOne(id)
        };
    }
}
