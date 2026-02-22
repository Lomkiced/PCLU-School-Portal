import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SchoolLevel } from '@sms/database';

@Injectable()
export class GradeLevelsService {
    constructor(private prisma: PrismaService) { }

    async create(data: { name: string; schoolLevel: SchoolLevel }) {
        return this.prisma.gradeLevel.create({ data });
    }

    async findAll() {
        return this.prisma.gradeLevel.findMany({
            include: { sections: true, subjects: true }
        });
    }
}
