import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentStatus } from '@sms/database';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StudentsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Creates a Student + User + Parent in a single Prisma transaction.
     * Default password: "student123" (bcrypt hashed).
     */
    async createStudentWithParent(data: {
        student: { firstName: string; lastName: string; email: string };
        parent: { firstName: string; lastName: string; occupation: string };
    }) {
        // Check for duplicate email
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.student.email },
        });
        if (existingUser) {
            throw new ConflictException('A user with this email already exists');
        }

        const defaultPassword = 'student123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        // Generate a student ID: YYYY-NEW-XXX
        const year = new Date().getFullYear();
        const count = await this.prisma.studentProfile.count({
            where: { studentId: { startsWith: `${year}-` } },
        });
        const sequence = (count + 1).toString().padStart(3, '0');
        const studentId = `${year}-NEW-${sequence}`;

        return this.prisma.$transaction(async (tx) => {
            // 1. Create the Student's User + Profile
            const user = await tx.user.create({
                data: {
                    email: data.student.email,
                    passwordHash,
                    role: 'STUDENT',
                    isFirstLogin: true,
                    studentProfile: {
                        create: {
                            studentId,
                            firstName: data.student.firstName,
                            lastName: data.student.lastName,
                            birthdate: new Date('2000-01-01'), // Placeholder
                            gender: 'N/A',
                            address: 'N/A',
                            guardianName: `${data.parent.firstName} ${data.parent.lastName}`,
                            guardianRelation: data.parent.occupation,
                            guardianContact: 'N/A',
                            enrollmentStatus: EnrollmentStatus.PENDING,
                        },
                    },
                },
                include: { studentProfile: true },
            });

            // 2. Create the Parent's User + Profile, linked to this student
            const parentPasswordHash = await bcrypt.hash('parent123', 10);
            const parentEmail = `parent.${data.student.email}`;

            await tx.user.create({
                data: {
                    email: parentEmail,
                    passwordHash: parentPasswordHash,
                    role: 'PARENT',
                    isFirstLogin: true,
                    parentProfile: {
                        create: {
                            firstName: data.parent.firstName,
                            lastName: data.parent.lastName,
                            contactNumber: 'N/A',
                            students: {
                                connect: [{ id: user.studentProfile!.id }],
                            },
                        },
                    },
                },
            });

            return user;
        });
    }

    /**
     * Returns enrolled students (those with a sectionId and ENROLLED status).
     */
    async findEnrolled(params: { search?: string }) {
        return this.prisma.studentProfile.findMany({
            where: {
                enrollmentStatus: EnrollmentStatus.ENROLLED,
                sectionId: { not: null },
                ...(params.search
                    ? {
                        OR: [
                            { firstName: { contains: params.search, mode: 'insensitive' as const } },
                            { lastName: { contains: params.search, mode: 'insensitive' as const } },
                            { studentId: { contains: params.search, mode: 'insensitive' as const } },
                        ],
                    }
                    : {}),
            },
            include: {
                user: { select: { email: true } },
                gradeLevel: true,
                section: true,
            },
            orderBy: { lastName: 'asc' },
        });
    }

    /**
     * Returns unenrolled students (no section, or PENDING/DROPPED status).
     */
    async findUnenrolled(params: { search?: string }) {
        return this.prisma.studentProfile.findMany({
            where: {
                OR: [
                    { sectionId: null },
                    { enrollmentStatus: { in: [EnrollmentStatus.PENDING, EnrollmentStatus.DROPPED] } },
                ],
                ...(params.search
                    ? {
                        AND: [
                            {
                                OR: [
                                    { firstName: { contains: params.search, mode: 'insensitive' as const } },
                                    { lastName: { contains: params.search, mode: 'insensitive' as const } },
                                    { studentId: { contains: params.search, mode: 'insensitive' as const } },
                                ],
                            },
                        ],
                    }
                    : {}),
            },
            include: {
                user: { select: { email: true } },
                gradeLevel: true,
                section: true,
            },
            orderBy: { lastName: 'asc' },
        });
    }

    async findAll(params: { skip?: number; take?: number; search?: string }) {
        const { skip, take, search } = params;
        return this.prisma.studentProfile.findMany({
            skip,
            take,
            where: search
                ? {
                    OR: [
                        { firstName: { contains: search, mode: 'insensitive' as const } },
                        { lastName: { contains: search, mode: 'insensitive' as const } },
                        { studentId: { contains: search, mode: 'insensitive' as const } },
                    ],
                }
                : undefined,
            include: { gradeLevel: true, section: true, user: { select: { email: true } } },
            orderBy: { lastName: 'asc' },
        });
    }

    async findOne(id: string) {
        const student = await this.prisma.studentProfile.findUnique({
            where: { id },
            include: {
                user: true,
                gradeLevel: true,
                section: true,
                enrollments: { include: { subject: true } },
                parents: true,
            },
        });
        if (!student) throw new NotFoundException('Student not found');
        return student;
    }
}
