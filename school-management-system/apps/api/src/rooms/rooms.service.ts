import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoomType } from '@sms/database';

@Injectable()
export class RoomsService {
    constructor(private prisma: PrismaService) { }

    async create(data: { name: string; capacity: number; type: RoomType; building: string; floor: string }) {
        return this.prisma.room.create({ data });
    }

    async findAll(type?: RoomType) {
        return this.prisma.room.findMany({
            where: type ? { type } : undefined
        });
    }
}
