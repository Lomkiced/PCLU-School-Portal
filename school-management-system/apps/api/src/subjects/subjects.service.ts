import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubjectType } from '@sms/database';

@Injectable()
export class SubjectsService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        name: string;
        code: string;
        units: number;
        credits?: number;
        lectureHours?: number;
        labHours?: number;
        description?: string;
        subjectType: SubjectType;
        gradeLevelId?: string;
        departmentId?: string;
        prerequisiteIds?: string[];
        corequisiteIds?: string[];
    }) {
        // Check for duplicate code
        const existing = await this.prisma.subject.findUnique({ where: { code: data.code } });
        if (existing) throw new BadRequestException(`Subject code "${data.code}" already exists`);

        // Cycle detection
        if (data.prerequisiteIds && data.prerequisiteIds.length > 0) {
            await this.checkPrerequisiteCycle(data.code, data.prerequisiteIds);
        }

        return this.prisma.subject.create({
            data: {
                name: data.name,
                code: data.code,
                units: data.units,
                credits: data.credits ?? data.units,
                lectureHours: data.lectureHours ?? 3,
                labHours: data.labHours ?? 0,
                description: data.description,
                subjectType: data.subjectType,
                gradeLevelId: data.gradeLevelId || undefined,
                departmentId: data.departmentId || undefined,
                prerequisites: data.prerequisiteIds?.length ? { connect: data.prerequisiteIds.map(id => ({ id })) } : undefined,
                corequisites: data.corequisiteIds?.length ? { connect: data.corequisiteIds.map(id => ({ id })) } : undefined,
            },
            include: { prerequisites: true, corequisites: true, department: true, gradeLevel: true },
        });
    }

    async update(id: string, data: {
        name?: string;
        code?: string;
        units?: number;
        credits?: number;
        lectureHours?: number;
        labHours?: number;
        description?: string;
        subjectType?: SubjectType;
        gradeLevelId?: string;
        departmentId?: string;
        prerequisiteIds?: string[];
        corequisiteIds?: string[];
    }) {
        const subject = await this.prisma.subject.findUnique({ where: { id } });
        if (!subject) throw new NotFoundException('Subject not found');

        // Code uniqueness check
        if (data.code && data.code !== subject.code) {
            const dup = await this.prisma.subject.findUnique({ where: { code: data.code } });
            if (dup) throw new BadRequestException(`Subject code "${data.code}" already exists`);
        }

        // Cycle detection
        if (data.prerequisiteIds && data.prerequisiteIds.length > 0) {
            await this.checkPrerequisiteCycle(data.code || subject.code, data.prerequisiteIds, id);
        }

        // Build update payload
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.code !== undefined) updateData.code = data.code;
        if (data.units !== undefined) updateData.units = data.units;
        if (data.credits !== undefined) updateData.credits = data.credits;
        if (data.lectureHours !== undefined) updateData.lectureHours = data.lectureHours;
        if (data.labHours !== undefined) updateData.labHours = data.labHours;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.subjectType !== undefined) updateData.subjectType = data.subjectType;
        if (data.gradeLevelId !== undefined) updateData.gradeLevelId = data.gradeLevelId || null;
        if (data.departmentId !== undefined) updateData.departmentId = data.departmentId || null;

        // Sync prerequisites: set (replace all)
        if (data.prerequisiteIds !== undefined) {
            updateData.prerequisites = { set: data.prerequisiteIds.map(pid => ({ id: pid })) };
        }
        if (data.corequisiteIds !== undefined) {
            updateData.corequisites = { set: data.corequisiteIds.map(pid => ({ id: pid })) };
        }

        return this.prisma.subject.update({
            where: { id },
            data: updateData,
            include: { prerequisites: true, corequisites: true, department: true, gradeLevel: true },
        });
    }

    private async checkPrerequisiteCycle(newSubjectCode: string, newPrerequisiteIds: string[], subjectIdToUpdate?: string) {
        const allSubjects = await this.prisma.subject.findMany({
            select: { id: true, code: true, prerequisites: { select: { id: true } } }
        });

        const adjList = new Map<string, string[]>();
        for (const sub of allSubjects) {
            adjList.set(sub.id, sub.prerequisites.map(p => p.id));
        }

        const tempId = subjectIdToUpdate || 'TEMP_NEW_NODE';
        adjList.set(tempId, newPrerequisiteIds);

        const visited = new Set<string>();
        const recStack = new Set<string>();

        const dfs = (nodeId: string): boolean => {
            if (!visited.has(nodeId)) {
                visited.add(nodeId);
                recStack.add(nodeId);

                const neighbors = adjList.get(nodeId) || [];
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor) && dfs(neighbor)) {
                        return true;
                    } else if (recStack.has(neighbor)) {
                        return true;
                    }
                }
            }
            recStack.delete(nodeId);
            return false;
        };

        if (dfs(tempId)) {
            throw new BadRequestException('Circular dependency detected in prerequisites chain.');
        }
    }

    async findAll() {
        return this.prisma.subject.findMany({
            include: {
                gradeLevel: true,
                department: true,
                prerequisites: { select: { id: true, name: true, code: true } },
                corequisites: { select: { id: true, name: true, code: true } },
            },
            orderBy: { code: 'asc' },
        });
    }

    async findOne(id: string) {
        const subject = await this.prisma.subject.findUnique({
            where: { id },
            include: {
                gradeLevel: true,
                department: true,
                prerequisites: true,
                corequisites: true,
            },
        });
        if (!subject) throw new NotFoundException('Subject not found');
        return subject;
    }

    async remove(id: string) {
        const subject = await this.prisma.subject.findUnique({ where: { id } });
        if (!subject) throw new NotFoundException('Subject not found');

        // Remove all relational links first
        await this.prisma.subject.update({
            where: { id },
            data: {
                prerequisites: { set: [] },
                corequisites: { set: [] },
            },
        });

        return this.prisma.subject.delete({ where: { id } });
    }
}
