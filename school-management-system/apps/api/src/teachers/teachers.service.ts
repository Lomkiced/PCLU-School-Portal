import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@sms/database';
import * as bcrypt from 'bcryptjs';
import { format } from 'date-fns';

@Injectable()
export class TeachersService {
    constructor(private prisma: PrismaService) { }

    async createTeacher(data: any) {
        const year = new Date().getFullYear();
        const count = await this.prisma.teacherProfile.count({
            where: { employeeId: { startsWith: `EMP-${year}-` } }
        });
        const sequence = (count + 1).toString().padStart(3, '0');
        const employeeId = `EMP-${year}-${sequence}`;

        const tempPassword = format(new Date(data.birthdate), 'MMddyyyy');
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email || `${employeeId}@school.edu`,
                    passwordHash,
                    role: 'TEACHER',
                    profilePicture: data.profilePictureUrl,
                    teacherProfile: {
                        create: {
                            employeeId,
                            firstName: data.firstName,
                            lastName: data.lastName,
                            middleName: data.middleName,
                            birthdate: new Date(data.birthdate),
                            gender: data.gender,
                            address: data.address,
                            contactNumber: data.contactNumber,
                            position: data.position,
                            departmentId: data.departmentId,
                        }
                    },
                    credential: {
                        create: {
                            username: employeeId,
                            plainPassword: tempPassword
                        }
                    }
                },
                include: { teacherProfile: true, credential: true }
            });

            if (data.assignments && data.assignments.length > 0) {
                const assignments = data.assignments.map((a: any) => ({
                    teacherId: user.teacherProfile!.id,
                    ...a
                }));
                await tx.teacherAssignment.createMany({ data: assignments });
            }

            if (data.advisorySectionId) {
                await tx.section.update({
                    where: { id: data.advisorySectionId },
                    data: { adviserId: user.teacherProfile!.id }
                });
            }

            return user;
        });

        return result;
    }

    async findAll(params: { skip?: number; take?: number; search?: string; departmentId?: string }) {
        const { skip, take, search, departmentId } = params;

        let whereClause: any = {};
        if (search) {
            whereClause.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { employeeId: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (departmentId) {
            whereClause.departmentId = departmentId;
        }

        return this.prisma.teacherProfile.findMany({
            skip,
            take,
            where: whereClause,
            include: { department: true }
        });
    }

    async findOne(id: string) {
        return this.prisma.teacherProfile.findUnique({
            where: { id },
            include: {
                user: true,
                department: true,
                advisoryClasses: true,
                assignments: { include: { subject: true, section: true } }
            }
        });
    }
}
