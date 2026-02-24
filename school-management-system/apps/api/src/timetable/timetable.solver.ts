import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway } from '../websocket/app.gateway';

export interface TimeSlot {
    dayOfWeek: number; // 1 = Monday, 5 = Friday
    startTime: string; // HH:mm
    endTime: string;
}

export interface CSPVariable {
    id: string;
    sectionId: string;
    subjectId: string;
    teacherId: string;
    subjectUnits: number;
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
    constructor(private prisma: PrismaService, private appGateway: AppGateway) { }

    private emitProgress(progress: number, message: string) {
        this.appGateway.server.emit('timetableProgress', { progress, message });
    }

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
        this.emitProgress(5, "Fetching data from database...");

        const sections = await this.prisma.section.findMany({ include: { students: true } });
        const teachers = await this.prisma.teacherProfile.findMany({ include: { sectionSubjects: { where: { academicYearId } } } });
        const rooms = await this.prisma.room.findMany();
        const subjects = await this.prisma.subject.findMany();
        const timeSlots = this.generateTimeSlots();

        this.emitProgress(20, "Building Constraint Variables...");

        // 1. Build CSP Variables
        const variables: CSPVariable[] = [];
        for (const t of teachers) {
            for (const a of t.sectionSubjects) {
                const subject = subjects.find(s => s.id === a.subjectId);
                if (!subject || !a.teacherId) continue;

                // 1 unit = 1 time slot class
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

        if (variables.length === 0) {
            this.emitProgress(100, "No assignments to schedule. Saving empty timetable.");
            return [];
        }

        this.emitProgress(40, "Calculating Initial Valid Domains...");

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

        this.emitProgress(60, "Solving Constraint Satisfaction Problem...");

        // 3. Backtracking Search with Forward Checking
        const solution: CSPSolution[] = [];
        const unassigned = [...variables];

        let permutationsChecked = 0;
        const MAX_PERMUTATIONS = 50000;

        const backtrack = async (): Promise<boolean> => {
            if (unassigned.length === 0) return true; // all assigned

            permutationsChecked++;
            if (permutationsChecked % 25 === 0) {
                // Yield to event loop occasionally to allow Websockets to emit and not block node thread
                await new Promise(resolve => setTimeout(resolve, 0));

                // Emitting realistic progress between 60 and 95
                const currentProgress = Math.min(95, 60 + Math.floor((solution.length / variables.length) * 35));
                this.emitProgress(currentProgress, `Checking permutation ${permutationsChecked}... Assigning block ${solution.length}/${variables.length}`);
            }

            if (permutationsChecked > MAX_PERMUTATIONS) {
                return false; // Force fail if it takes too long to avoid endless hang
            }

            // Most Constrained Variable (MCV) - pick var with fewest domain choices
            unassigned.sort((a, b) => (domains.get(a.id)?.length || 0) - (domains.get(b.id)?.length || 0));
            const currentVar = unassigned.shift()!;

            const currentDomain = domains.get(currentVar.id) || [];

            for (const val of currentDomain) {
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

                    if (await backtrack()) return true;

                    solution.pop(); // backtrack
                }
            }

            unassigned.unshift(currentVar);
            return false;
        };

        const success = await backtrack();

        if (!success) {
            this.emitProgress(100, "Failed to generate timetable.");
            throw new BadRequestException(`Could not generate a conflict-free timetable in ${permutationsChecked} iterations. Please add more rooms, teachers, or timeslots.`);
        }

        this.emitProgress(100, "Successfully generated conflict-free timetable!");
        return solution;
    }
}
