import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, RoomType } from '@sms/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) { }

    @Roles('ADMIN')
    @Post()
    async create(@Body() body: any) {
        return {
            success: true,
            data: await this.roomsService.create(body),
        };
    }

    @Roles('ADMIN')
    @Get()
    async findAll(@Query('type') type?: RoomType) {
        return {
            success: true,
            data: await this.roomsService.findAll(type),
        };
    }
}
