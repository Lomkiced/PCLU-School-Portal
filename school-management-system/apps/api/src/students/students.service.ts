import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentStatus } from '@sms/database';
import { Gender } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StudentsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Creates a Student + User + Parent in a single Prisma transaction.
     * Default password: "student123" (bcrypt hashed).
     */
    async createStudentWithParent(data: {
        student: { firstName: string; lastName: string; email: string; gender: string };
        parent: { firstName: string; lastName: string; occupation: string; contactNumber: string };
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
                            gender: data.student.gender as Gender,
                            address: 'N/A',
                            guardianName: `${data.parent.firstName} ${data.parent.lastName}`,
                            guardianRelation: data.parent.occupation,
                            guardianContact: data.parent.contactNumber,
                            enrollmentStatus: EnrollmentStatus.ACTIVE,
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
                            contactNumber: data.parent.contactNumber,
                            students: {
                                connect: [{ id: (user as any).studentProfile!.id }],
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
    async findEnrolled(params: { search?: string; gradeLevelId?: string }) {
        return this.prisma.studentProfile.findMany({
            where: {
                enrollmentStatus: EnrollmentStatus.ACTIVE,
                sectionId: { not: null },
                ...(params.gradeLevelId ? { gradeLevelId: params.gradeLevelId } : {}),
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
                parents: { select: { firstName: true, lastName: true, contactNumber: true } },
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
                    { enrollmentStatus: EnrollmentStatus.DROPPED },
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
                parents: { select: { firstName: true, lastName: true, contactNumber: true } },
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
            include: { gradeLevel: true, section: true, user: { select: { email: true } }, parents: { select: { firstName: true, lastName: true, contactNumber: true } } },
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

    /**
     * Assigns an unenrolled student to a grade level and section.
     * Updates enrollment status to ENROLLED.
     */
    async enrollStudent(data: { studentId: string; gradeLevelId: string; sectionId: string }) {
        const student = await this.prisma.studentProfile.findUnique({
            where: { id: data.studentId },
        });
        if (!student) throw new NotFoundException('Student not found');

        return this.prisma.studentProfile.update({
            where: { id: data.studentId },
            data: {
                gradeLevelId: data.gradeLevelId,
                sectionId: data.sectionId,
                enrollmentStatus: EnrollmentStatus.ACTIVE,
            },
            include: {
                gradeLevel: true,
                section: true,
                user: { select: { email: true } },
            },
        });
    }

    /**
     * Partial update: Student profile fields, User email, and first Parent's details.
     */
    async updateStudent(
        id: string,
        data: {
            firstName?: string;
            lastName?: string;
            gender?: string;
            email?: string;
            parentFirstName?: string;
            parentLastName?: string;
            parentContactNumber?: string;
            parentOccupation?: string;
        },
    ) {
        const student = await this.prisma.studentProfile.findUnique({
            where: { id },
            include: { parents: true },
        });
        if (!student) throw new NotFoundException('Student not found');

        // Check email uniqueness if changing
        if (data.email) {
            const existing = await this.prisma.user.findFirst({
                where: { email: data.email, id: { not: student.userId } },
            });
            if (existing) throw new ConflictException('A user with this email already exists');
        }

        // Build student profile update data
        const profileUpdate: any = {};
        if (data.firstName) profileUpdate.firstName = data.firstName;
        if (data.lastName) profileUpdate.lastName = data.lastName;
        if (data.gender) profileUpdate.gender = data.gender;

        // Build parent-related guardian fields
        if (data.parentFirstName || data.parentLastName) {
            const pFirst = data.parentFirstName || student.parents[0]?.firstName || '';
            const pLast = data.parentLastName || student.parents[0]?.lastName || '';
            profileUpdate.guardianName = `${pFirst} ${pLast}`;
        }
        if (data.parentContactNumber) {
            profileUpdate.guardianContact = data.parentContactNumber;
        }
        if (data.parentOccupation) {
            profileUpdate.guardianRelation = data.parentOccupation;
        }

        return this.prisma.$transaction(async (tx: any) => {
            // 1. Update StudentProfile
            const updated = await tx.studentProfile.update({
                where: { id },
                data: profileUpdate,
                include: {
                    user: { select: { email: true } },
                    gradeLevel: true,
                    section: true,
                    parents: { select: { id: true, firstName: true, lastName: true, contactNumber: true } },
                },
            });

            // 2. Update User email if provided
            if (data.email) {
                await tx.user.update({
                    where: { id: student.userId },
                    data: { email: data.email },
                });
            }

            // 3. Update first linked Parent if fields provided
            if (student.parents[0] && (data.parentFirstName || data.parentLastName || data.parentContactNumber)) {
                const parentUpdate: any = {};
                if (data.parentFirstName) parentUpdate.firstName = data.parentFirstName;
                if (data.parentLastName) parentUpdate.lastName = data.parentLastName;
                if (data.parentContactNumber) parentUpdate.contactNumber = data.parentContactNumber;

                await tx.parentProfile.update({
                    where: { id: student.parents[0].id },
                    data: parentUpdate,
                });
            }

            return updated;
        });
    }

    /**
     * Hard-deletes a student, their parent, and all linked records in a transaction.
     * Order: clear relations → delete child records → delete profiles → delete users.
     */
    async deleteStudent(id: string) {
        const student = await this.prisma.studentProfile.findUnique({
            where: { id },
            include: {
                parents: { include: { user: true } },
                user: true,
            },
        });
        if (!student) throw new NotFoundException('Student not found');

        return this.prisma.$transaction(async (tx: any) => {
            // 1. Disconnect student from parents (many-to-many)
            for (const parent of student.parents) {
                await tx.parentProfile.update({
                    where: { id: parent.id },
                    data: { students: { disconnect: [{ id }] } },
                });
            }

            // 2. Delete child records that reference the student
            await tx.subjectEnrollment.deleteMany({ where: { studentId: id } });
            await tx.attendanceRecord.deleteMany({ where: { studentId: id } });
            await tx.grade.deleteMany({ where: { studentId: id } });
            await tx.quizSubmission.deleteMany({ where: { studentId: id } });
            await tx.activitySubmission.deleteMany({ where: { studentId: id } });
            await tx.studentFee.deleteMany({ where: { studentId: id } });

            // 3. Delete StudentProfile
            await tx.studentProfile.delete({ where: { id } });

            // 4. Delete the Student's User account
            await tx.user.delete({ where: { id: student.userId } });

            // 5. Delete orphaned parent profiles + user accounts
            for (const parent of student.parents) {
                const remainingStudents = await tx.parentProfile.findUnique({
                    where: { id: parent.id },
                    include: { _count: { select: { students: true } } },
                });
                if (remainingStudents && remainingStudents._count.students === 0) {
                    await tx.parentProfile.delete({ where: { id: parent.id } });
                    if (parent.userId) {
                        await tx.user.delete({ where: { id: parent.userId } });
                    }
                }
            }

            return { deleted: true };
        });
    }
}
