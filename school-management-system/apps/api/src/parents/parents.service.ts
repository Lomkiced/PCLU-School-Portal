import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@sms/database';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ParentsService {
    constructor(private prisma: PrismaService) { }

    async createParent(data: any) {
        // In a real scenario, parent account could be created during student enrollment
        // or separately linking to student IDs
        const passwordHash = await bcrypt.hash('parent123', 10);

        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    role: 'PARENT',
                    parentProfile: {
                        create: {
                            firstName: data.firstName,
                            lastName: data.lastName,
                            contactNumber: data.contactNumber,
                        }
                    }
                },
                include: { parentProfile: true }
            });

            if (data.studentIds && data.studentIds.length > 0) {
                await tx.parentProfile.update({
                    where: { id: user.parentProfile!.id },
                    data: {
                        students: { connect: data.studentIds.map((id: string) => ({ id })) }
                    }
                });
            }

            return user;
        });
    }

    async findAll(params: { skip?: number; take?: number; search?: string }) {
        const { skip, take, search } = params;
        return this.prisma.parentProfile.findMany({
            skip,
            take,
            where: search ? {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                ]
            } : undefined,
            include: { students: true }
        });
    }

    async findOne(id: string) {
        return this.prisma.parentProfile.findUnique({
            where: { id },
            include: {
                user: true,
                students: {
                    include: { gradeLevel: true, section: true, attendance: true }
                }
            }
        });
    }
}
