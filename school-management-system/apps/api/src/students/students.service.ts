import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, EnrollmentStatus } from '@sms/database';
import * as bcrypt from 'bcryptjs';
import { FileUploadService } from '../file-upload/file-upload.service';
import { IdGeneratorService } from '../id-generator/id-generator.service';
import { format } from 'date-fns';

@Injectable()
export class StudentsService {
    constructor(
        private prisma: PrismaService,
        private fileUpload: FileUploadService,
        private idGenerator: IdGeneratorService,
    ) { }

    async createStudent(data: any) {
        const year = new Date().getFullYear();
        const gradeString = await this.getGradeLevelString(data.gradeLevelId);

        const count = await this.prisma.studentProfile.count({
            where: {
                studentId: { startsWith: `${year}-${gradeString}-` }
            }
        });
        const sequence = (count + 1).toString().padStart(3, '0');
        const studentId = `${year}-${gradeString}-${sequence}`;

        const tempPassword = format(new Date(data.birthdate), 'MMddyyyy');
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const qrBuffer = await this.idGenerator.generateQRCode(studentId);
        const qrFileName = `qrcodes/${studentId}.png`;
        await this.fileUpload.uploadFile(qrBuffer, qrFileName, 'image/png');

        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email || `${studentId}@school.edu`,
                    passwordHash,
                    role: 'STUDENT',
                    profilePicture: data.profilePictureUrl,
                    studentProfile: {
                        create: {
                            studentId,
                            firstName: data.firstName,
                            lastName: data.lastName,
                            middleName: data.middleName,
                            birthdate: new Date(data.birthdate),
                            gender: data.gender,
                            address: data.address,
                            guardianName: data.guardianName,
                            guardianRelation: data.guardianRelation,
                            guardianContact: data.guardianContact,
                            guardianEmail: data.guardianEmail,
                            qrCodeUrl: qrFileName,
                            enrollmentStatus: EnrollmentStatus.ENROLLED,
                            gradeLevelId: data.gradeLevelId,
                            sectionId: data.sectionId,
                        }
                    },
                    credential: {
                        create: {
                            username: studentId,
                            plainPassword: tempPassword
                        }
                    }
                },
                include: { studentProfile: true, credential: true }
            });

            const assignments = await tx.teacherAssignment.findMany({
                where: { sectionId: data.sectionId, academicYearId: data.academicYearId },
                select: { subjectId: true }
            });

            const enrollments = assignments.map(a => ({
                studentId: user.studentProfile!.id,
                subjectId: a.subjectId,
                sectionId: data.sectionId,
                academicYearId: data.academicYearId,
            }));

            if (enrollments.length > 0) {
                await tx.subjectEnrollment.createMany({ data: enrollments });
            }

            return user;
        });

        return result;
    }

    private async getGradeLevelString(gradeLevelId: string) {
        const level = await this.prisma.gradeLevel.findUnique({ where: { id: gradeLevelId } });
        if (!level) return 'X';
        // Clean string to get grade identifier
        return level.name.replace(/\D/g, '') || level.name.substring(0, 1).toUpperCase();
    }

    async findAll(params: { skip?: number; take?: number; search?: string }) {
        const { skip, take, search } = params;
        return this.prisma.studentProfile.findMany({
            skip,
            take,
            where: search ? {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { studentId: { contains: search, mode: 'insensitive' } },
                ]
            } : undefined,
            include: { gradeLevel: true, section: true }
        });
    }

    async findOne(id: string) {
        return this.prisma.studentProfile.findUnique({
            where: { id },
            include: {
                user: true,
                gradeLevel: true,
                section: true,
                enrollments: { include: { subject: true } }
            }
        });
    }
}
