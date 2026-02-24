import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimetableSolver, CSPSolution } from './timetable.solver';
import { DayOfWeek } from '@sms/database';

@Injectable()
export class TimetableService {
    constructor(
        private prisma: PrismaService,
        private solver: TimetableSolver
    ) { }

    async generate(academicYearId: string) {
        // 1. Ensure an active AcademicYear
        const ay = await this.prisma.academicYear.findUnique({ where: { id: academicYearId } });
        if (!ay) throw new NotFoundException('Academic Year not found');

        // 2. Solve CSP
        const solution = await this.solver.solve(academicYearId);

        // 3. Save result to DB
        return this.prisma.$transaction(async (tx) => {
            // Clear existing timetable for this academic year
            await tx.timetable.deleteMany({ where: { academicYearId } });

            const timetable = await tx.timetable.create({
                data: {
                    name: `Master Schedule - ${ay.label}`,
                    academicYearId: ay.id,
                    status: 'DRAFT',
                }
            });

            const slots = solution.map(s => ({
                timetableId: timetable.id,
                subjectId: s.subjectId,
                teacherId: s.teacherId,
                roomId: s.roomId,
                sectionId: s.sectionId,
                dayOfWeek: DayOfWeek[Object.keys(DayOfWeek)[s.dayOfWeek - 1] as keyof typeof DayOfWeek], // 1 = Monday
                startTime: s.startTime,
                endTime: s.endTime,
            }));

            await tx.timetableSlot.createMany({ data: slots });

            return timetable;
        });
    }

    async getSectionTimetable(sectionId: string) {
        return this.prisma.timetableSlot.findMany({
            where: { sectionId },
            include: { subject: true, room: true }
        });
    }

    async getTeacherTimetable(teacherId: string) {
        return this.prisma.timetableSlot.findMany({
            where: { teacherId },
            include: { subject: true, section: true, room: true }
        });
    }

    async getRoomTimetable(roomId: string) {
        return this.prisma.timetableSlot.findMany({
            where: { roomId },
            include: { subject: true, section: true }
        });
    }

    async getAllTimetables() {
        return this.prisma.timetableSlot.findMany({
            include: { subject: true, section: true, room: true, teacher: true }
        });
    }

    async updateTimeslot(id: string, data: { dayOfWeek: DayOfWeek; startTime: string; endTime: string; roomId: string }) {
        return this.prisma.timetableSlot.update({
            where: { id },
            data: {
                dayOfWeek: data.dayOfWeek,
                startTime: data.startTime,
                endTime: data.endTime,
                roomId: data.roomId,
            }
        });
    }
}
