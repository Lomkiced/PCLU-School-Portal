import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubjectType } from '@sms/database';

@Injectable()
export class SubjectsService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        name: string;
        code: string;
        units: number;
        description?: string;
        subjectType: SubjectType;
        gradeLevelId?: string;
        prerequisiteIds?: string[];
        corequisiteIds?: string[];
    }) {
        if (data.prerequisiteIds && data.prerequisiteIds.length > 0) {
            await this.checkPrerequisiteCycle(data.code, data.prerequisiteIds);
        }

        return this.prisma.subject.create({
            data: {
                name: data.name,
                code: data.code,
                units: data.units,
                description: data.description,
                subjectType: data.subjectType,
                gradeLevelId: data.gradeLevelId,
                prerequisites: data.prerequisiteIds ? { connect: data.prerequisiteIds.map(id => ({ id })) } : undefined,
                corequisites: data.corequisiteIds ? { connect: data.corequisiteIds.map(id => ({ id })) } : undefined,
            },
            include: { prerequisites: true, corequisites: true }
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
                prerequisites: true,
                corequisites: true
            }
        });
    }
}
