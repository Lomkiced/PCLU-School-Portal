import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimetableSolver, CSPSolution } from './timetable.solver';

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
            await tx.timetable.deleteMany({ where: { label: { contains: ay.label } } });

            const timetable = await tx.timetable.create({
                data: {
                    label: `Master Schedule - ${ay.label}`,
                    isActive: false,
                }
            });

            const slots = solution.map(s => ({
                timetableId: timetable.id,
                subjectId: s.subjectId,
                teacherId: s.teacherId,
                roomId: s.roomId,
                sectionId: s.sectionId,
                dayOfWeek: s.dayOfWeek as any,
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
}
