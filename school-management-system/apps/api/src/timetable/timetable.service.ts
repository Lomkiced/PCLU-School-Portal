import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
                    name: `Master Schedule - ${ay.name}`,
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
            include: { subject: true, room: true, teacher: true }
        });
    }

    async getTeacherTimetable(teacherId: string) {
        return this.prisma.timetableSlot.findMany({
            where: { teacherId },
            include: { subject: true, section: true, room: true, teacher: true }
        });
    }

    async getRoomTimetable(roomId: string) {
        return this.prisma.timetableSlot.findMany({
            where: { roomId },
            include: { subject: true, section: true, room: true, teacher: true }
        });
    }

    async getAllTimetables() {
        return this.prisma.timetableSlot.findMany({
            include: { subject: true, section: true, room: true, teacher: true }
        });
    }

    async updateTimeslot(id: string, data: { dayOfWeek: DayOfWeek; startTime: string; endTime: string; roomId: string; teacherId?: string }) {
        const slot = await this.prisma.timetableSlot.findUnique({ where: { id } });
        if (!slot) throw new NotFoundException('Timeslot not found');

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(data.startTime) || !timeRegex.test(data.endTime)) {
            throw new BadRequestException('Invalid time format. Use HH:mm');
        }
        if (data.startTime >= data.endTime) {
            throw new BadRequestException('End time must be strictly greater than start time.');
        }

        // The teacherId for conflict check should be the one provided in data, or the existing one if not provided.
        // The sectionId for conflict check should be the existing slot's sectionId.
        await this.checkConflict(data.teacherId || slot.teacherId, data.roomId, slot.sectionId, data.dayOfWeek, data.startTime, data.endTime, id);

        return this.prisma.timetableSlot.update({
            where: { id },
            data: {
                dayOfWeek: data.dayOfWeek,
                startTime: data.startTime,
                endTime: data.endTime,
                roomId: data.roomId,
                ...(data.teacherId ? { teacherId: data.teacherId } : {})
            }
        });
    }

    private async checkConflict(teacherId: string, roomId: string, sectionId: string, dayOfWeek: DayOfWeek, startTime: string, endTime: string, currentTimeslotId?: string) {
        const existingSlots = await this.prisma.timetableSlot.findMany({
            where: {
                OR: [
                    { teacherId },
                    { roomId },
                    { sectionId }
                ],
                dayOfWeek,
                ...(currentTimeslotId ? { id: { not: currentTimeslotId } } : {})
            },
            include: { section: true, teacher: true, room: true, subject: true }
        });

        for (const slot of existingSlots) {
            // Check for overlap: start1 < end2 AND end1 > start2
            if (startTime < slot.endTime && endTime > slot.startTime) {
                if (slot.sectionId === sectionId && slot.subjectId === currentTimeslotId) {
                    // In case of updating self, safely ignored by the `{ not: id }` query
                } else if (slot.sectionId === sectionId) {
                    throw new BadRequestException(`This section already has ${slot.subject.name} scheduled at this time.`);
                }

                if (slot.teacherId === teacherId) {
                    throw new BadRequestException(`Teacher ${slot.teacher.firstName} ${slot.teacher.lastName} is already booked for Section ${slot.section.name} at this time.`);
                }
                if (slot.roomId === roomId) {
                    throw new BadRequestException(`Room ${slot.room.name} is already booked for Section ${slot.section.name} at this time.`);
                }
            }
        }
    }

    async createTimeslot(sectionId: string, data: { dayOfWeek: DayOfWeek, startTime: string, endTime: string, subjectId: string, teacherId: string, roomId: string, academicYearId: string }) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(data.startTime) || !timeRegex.test(data.endTime)) {
            throw new BadRequestException('Invalid time format. Use HH:mm');
        }
        if (data.startTime >= data.endTime) {
            throw new BadRequestException('End time must be strictly greater than start time.');
        }

        await this.checkConflict(data.teacherId, data.roomId, sectionId, data.dayOfWeek, data.startTime, data.endTime);

        let timetable = await this.prisma.timetable.findFirst({
            where: { academicYearId: data.academicYearId }
        });

        if (!timetable) {
            const ay = await this.prisma.academicYear.findUnique({ where: { id: data.academicYearId } });
            if (!ay) throw new NotFoundException('Academic Year not found');
            timetable = await this.prisma.timetable.create({
                data: {
                    name: `Master Schedule - ${ay.name}`,
                    academicYearId: ay.id,
                    status: 'DRAFT'
                }
            });
        }

        return this.prisma.timetableSlot.create({
            data: {
                timetableId: timetable.id,
                sectionId,
                subjectId: data.subjectId,
                teacherId: data.teacherId,
                roomId: data.roomId,
                dayOfWeek: data.dayOfWeek,
                startTime: data.startTime,
                endTime: data.endTime
            },
            include: { subject: true, teacher: true, room: true, section: true }
        });
    }

    async deleteTimeslot(id: string) {
        return this.prisma.timetableSlot.delete({ where: { id } });
    }
}
