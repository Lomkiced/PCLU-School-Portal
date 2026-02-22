import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
    constructor(private prisma: PrismaService) { }

    async create(data: { name: string; headTeacherId?: string }) {
        return this.prisma.department.create({ data });
    }

    async findAll() {
        return this.prisma.department.findMany({
            include: { headTeacher: true, teachers: true }
        });
    }
}
