import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { format } from 'date-fns';

@Injectable()
export class TeachersService {
    constructor(private prisma: PrismaService) { }

    /**
     * Simplified faculty creation: creates User + TeacherProfile in a transaction.
     * Default password: "teacher123" (hashed).
     */
    async addFaculty(data: {
        firstName: string;
        lastName: string;
        email: string;
        position: string;
        departmentId: string;
        contactNumber: string;
    }) {
        // Check for duplicate email
        const existing = await this.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existing) {
            throw new ConflictException('A user with this email already exists');
        }

        const year = new Date().getFullYear();
        const count = await this.prisma.teacherProfile.count({
            where: { employeeId: { startsWith: `EMP-${year}-` } },
        });
        const sequence = (count + 1).toString().padStart(3, '0');
        const employeeId = `EMP-${year}-${sequence}`;

        const defaultPassword = 'teacher123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        return this.prisma.$transaction(async (tx: any) => {
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    role: 'TEACHER',
                    isFirstLogin: true,
                    teacherProfile: {
                        create: {
                            employeeId,
                            firstName: data.firstName,
                            lastName: data.lastName,
                            birthdate: new Date('1990-01-01'), // Placeholder
                            gender: 'N/A',
                            address: 'N/A',
                            contactNumber: data.contactNumber || 'N/A',
                            position: data.position,
                            departmentId: data.departmentId,
                        },
                    },
                },
                include: { teacherProfile: true },
            });

            return user;
        });
    }

    async createTeacher(data: any) {
        const year = new Date().getFullYear();
        const count = await this.prisma.teacherProfile.count({
            where: { employeeId: { startsWith: `EMP-${year}-` } }
        });
        const sequence = (count + 1).toString().padStart(3, '0');
        const employeeId = `EMP-${year}-${sequence}`;

        const tempPassword = format(new Date(data.birthdate), 'MMddyyyy');
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const result = await this.prisma.$transaction(async (tx: any) => {
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
                await tx.sectionSubject.createMany({ data: assignments });
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

    async getMyClasses(userId: string) {
        const teacherProfile = await this.prisma.teacherProfile.findUnique({
            where: { userId }
        });

        if (!teacherProfile) {
            throw new NotFoundException('Teacher profile not found');
        }

        const sectionSubjects = await this.prisma.sectionSubject.findMany({
            where: {
                teacherId: teacherProfile.id,
            },
            include: {
                section: {
                    include: {
                        gradeLevel: true,
                        room: true,
                        _count: {
                            select: { students: true }
                        },
                        timetableSlots: {
                            where: { teacherId: teacherProfile.id },
                            include: { room: true }
                        }
                    }
                },
                subject: true,
            }
        });

        return sectionSubjects.map(ss => {
            const slots = ss.section.timetableSlots.filter(t => t.subjectId === ss.subjectId);
            const schedule = slots.length > 0
                ? slots.map(s => `${s.dayOfWeek.substring(0, 3)} ${s.startTime}`).join(', ')
                : 'TBA';
            const roomNumber = slots.length > 0 && slots[0].room
                ? slots[0].room.name
                : ss.section.room?.name || 'TBA';

            return {
                id: ss.section.id,
                subjectId: ss.subject.id,
                academicYearId: ss.academicYearId,
                name: ss.section.name,
                gradeLevel: ss.section.gradeLevel.name,
                subjectTaught: `${ss.subject.code} - ${ss.subject.name}`,
                roomNumber: roomNumber,
                studentsCount: ss.section._count.students,
                schedule: schedule
            };
        });
    }

    async findAll(params: { skip?: number; take?: number; search?: string; departmentId?: string }) {
        const { skip, take, search, departmentId } = params;

        const whereClause: any = {};
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
            include: {
                department: true,
                user: { select: { email: true } },
            },
            orderBy: { lastName: 'asc' },
        });
    }

    async findOne(id: string) {
        const teacher = await this.prisma.teacherProfile.findUnique({
            where: { id },
            include: {
                user: true,
                department: true,
                advisoryClasses: true,
                sectionSubjects: { include: { subject: true, section: true } }
            }
        });
        if (!teacher) throw new NotFoundException('Teacher not found');
        return teacher;
    }
}
