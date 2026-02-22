import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@sms/database';

@Injectable()
export class AttendanceService {
    constructor(private prisma: PrismaService) { }

    async markAttendance(data: { studentId: string; sectionId: string; status: AttendanceStatus; scannedBy: string; date?: string }) {
        const today = data.date ? new Date(data.date) : new Date();
        today.setHours(0, 0, 0, 0);

        return this.prisma.attendanceRecord.upsert({
            where: {
                studentId_sectionId_date: {
                    studentId: data.studentId,
                    sectionId: data.sectionId,
                    date: today
                }
            },
            update: {
                status: data.status,
                scannedAt: new Date(),
                scannedBy: data.scannedBy
            },
            create: {
                studentId: data.studentId,
                sectionId: data.sectionId,
                date: today,
                status: data.status,
                scannedAt: new Date(),
                scannedBy: data.scannedBy
            }
        });
    }

    async getSectionAttendance(sectionId: string, dateStr: string) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        return this.prisma.attendanceRecord.findMany({
            where: { sectionId, date },
            include: { student: { include: { user: { select: { profilePicture: true } } } } }
        });
    }
}
