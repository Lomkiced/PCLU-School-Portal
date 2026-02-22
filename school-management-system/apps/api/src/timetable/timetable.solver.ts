import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TimeSlot {
    dayOfWeek: number; // 1 = Monday, 5 = Friday
    startTime: string; // HH:mm
    endTime: string;
}

export interface CSPVariable {
    id: string; // unique string for the subject-section requirement
    sectionId: string;
    subjectId: string;
    teacherId: string;
    teacherName?: string;
    subjectUnits: number; // number of slots needed
}

export interface CSPDomainValue {
    roomId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

export interface CSPSolution {
    variableId: string;
    sectionId: string;
    subjectId: string;
    teacherId: string;
    roomId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

@Injectable()
export class TimetableSolver {
    constructor(private prisma: PrismaService) { }

    generateTimeSlots(): TimeSlot[] {
        const slots: TimeSlot[] = [];
        const days = [1, 2, 3, 4, 5]; // Mon-Fri
        const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

        for (const d of days) {
            for (const h of hours) {
                const start = parseInt(h.split(':')[0]);
                const nextH = (start + 1).toString().padStart(2, '0');
                slots.push({ dayOfWeek: d, startTime: h, endTime: `${nextH}:00` });
            }
        }
        return slots;
    }

    async solve(academicYearId: string): Promise<CSPSolution[]> {
        const sections = await this.prisma.section.findMany({ include: { students: true } });
        const teachers = await this.prisma.teacherProfile.findMany({ include: { assignments: { where: { academicYearId } } } });
        const rooms = await this.prisma.room.findMany();
        const subjects = await this.prisma.subject.findMany();

        const timeSlots = this.generateTimeSlots();

        // 1. Build CSP Variables (what needs to be scheduled)
        const variables: CSPVariable[] = [];
        for (const t of teachers) {
            for (const a of t.assignments) {
                const subject = subjects.find(s => s.id === a.subjectId);
                if (!subject) continue;

                // Let's assume 1 unit = 1 time slot class
                for (let i = 0; i < subject.units; i++) {
                    variables.push({
                        id: `${a.sectionId}-${a.subjectId}-${i}`,
                        sectionId: a.sectionId,
                        subjectId: a.subjectId,
                        teacherId: a.teacherId,
                        subjectUnits: subject.units
                    });
                }
            }
        }

        if (variables.length === 0) return [];

        // 2. Initial domains for all variables
        const domains = new Map<string, CSPDomainValue[]>();
        for (const v of variables) {
            const section = sections.find(s => s.id === v.sectionId);
            const subject = subjects.find(s => s.id === v.subjectId);
            const validValues: CSPDomainValue[] = [];

            for (const r of rooms) {
                // Hard constraint: Room capacity >= section student count
                if (r.capacity < (section?.students?.length || 0)) continue;

                // Hard constraint: Room type matches subject type
                // simplified logic: if subject type is lab, room must be lab
                if (subject?.subjectType === 'SPECIALIZED' && r.type !== 'LAB') continue;
                if (subject?.subjectType === 'CORE' && r.type !== 'CLASSROOM') continue;

                for (const ts of timeSlots) {
                    validValues.push({
                        roomId: r.id,
                        dayOfWeek: ts.dayOfWeek,
                        startTime: ts.startTime,
                        endTime: ts.endTime
                    });
                }
            }
            domains.set(v.id, validValues);
        }

        // 3. Backtracking Search with Forward Checking
        const solution: CSPSolution[] = [];

        // Convert to array of variables to assign
        const unassigned = [...variables];

        const backtrack = (): boolean => {
            if (unassigned.length === 0) return true; // all assigned

            // Variable ordering: Most Constrained Variable (MCV) - pick var with smallest domain
            unassigned.sort((a, b) => (domains.get(a.id)?.length || 0) - (domains.get(b.id)?.length || 0));
            const currentVar = unassigned.shift()!;

            const currentDomain = domains.get(currentVar.id) || [];

            for (const val of currentDomain) {
                // Check constraints against current partial solution
                let conflict = false;
                for (const s of solution) {
                    if (s.dayOfWeek === val.dayOfWeek && s.startTime === val.startTime) {
                        // Hard: No teacher double-booked
                        if (s.teacherId === currentVar.teacherId) { conflict = true; break; }
                        // Hard: No room double-booked
                        if (s.roomId === val.roomId) { conflict = true; break; }
                        // Hard: No section scheduled for two subjects simultaneously
                        if (s.sectionId === currentVar.sectionId) { conflict = true; break; }
                    }
                }

                if (!conflict) {
                    // Assign
                    solution.push({
                        variableId: currentVar.id,
                        sectionId: currentVar.sectionId,
                        subjectId: currentVar.subjectId,
                        teacherId: currentVar.teacherId,
                        roomId: val.roomId,
                        dayOfWeek: val.dayOfWeek,
                        startTime: val.startTime,
                        endTime: val.endTime,
                    });

                    // Recurse
                    if (backtrack()) return true;

                    // Backtrack
                    solution.pop();
                }
            }

            // If all values fail, put back variable and return false
            unassigned.unshift(currentVar);
            return false;
        };

        const success = backtrack();
        if (!success) {
            throw new BadRequestException('Could not generate a conflict-free timetable. Please add more rooms, teachers, or timeslots.');
        }

        return solution;
    }
}
