import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class GradesService {
    constructor(private prisma: PrismaService) { }

    async saveGrade(data: {
        studentId: string;
        subjectId: string;
        academicYearId: string;
        quarter: number;
        writtenWorks: number;
        performanceTasks: number;
        quarterlyAssessment: number;
    }) {
        // DepEd formula: WW 20% + PT 60% + QA 20%
        const wwWeight = 0.20;
        const ptWeight = 0.60;
        const qaWeight = 0.20;

        const finalGrade =
            (data.writtenWorks * wwWeight) +
            (data.performanceTasks * ptWeight) +
            (data.quarterlyAssessment * qaWeight);

        let remarks = '';
        if (finalGrade >= 90) remarks = 'Outstanding';
        else if (finalGrade >= 85) remarks = 'Very Satisfactory';
        else if (finalGrade >= 80) remarks = 'Satisfactory';
        else if (finalGrade >= 75) remarks = 'Fairly Satisfactory';
        else remarks = 'Did Not Meet Expectations';

        // The unique constraint is studentId_subjectId_academicYearId_quarter
        // But since quarter is Int, and those 4 fields have @@unique, upsert will work
        return this.prisma.grade.upsert({
            where: {
                studentId_subjectId_academicYearId_quarter: {
                    studentId: data.studentId,
                    subjectId: data.subjectId,
                    academicYearId: data.academicYearId,
                    quarter: data.quarter
                }
            },
            update: {
                writtenWorks: data.writtenWorks,
                performanceTasks: data.performanceTasks,
                quarterlyAssessment: data.quarterlyAssessment,
                finalGrade,
                remarks
            },
            create: {
                studentId: data.studentId,
                subjectId: data.subjectId,
                academicYearId: data.academicYearId,
                quarter: data.quarter,
                writtenWorks: data.writtenWorks,
                performanceTasks: data.performanceTasks,
                quarterlyAssessment: data.quarterlyAssessment,
                finalGrade,
                remarks
            }
        });
    }

    async computeFinalGrade(studentId: string, subjectId: string, academicYearId: string) {
        const grades = await this.prisma.grade.findMany({
            where: { studentId, subjectId, academicYearId }
        });

        // Usually, average of 4 quarters
        if (grades.length !== 4) return null;

        const sum = grades.reduce((acc, curr) => acc + curr.finalGrade, 0);
        return sum / 4;
    }

    async generateRemarks(gradeId: string) {
        const grade = await this.prisma.grade.findUnique({
            where: { id: gradeId },
            include: {
                student: true,
                subject: true
            }
        });

        if (!grade) throw new NotFoundException('Grade not found');

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const prompt = `Write a 2-sentence constructive report card remark for a student named ${grade.student.firstName}. Their final grade in ${grade.subject.name} for quarter ${grade.quarter} is ${grade.finalGrade.toFixed(2)} (${grade.remarks}). Keep it professional, encouraging, and tailored to the performance level.`;

        let generatedFeedback = '';
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 100,
            });

            generatedFeedback = response.choices[0]?.message?.content?.trim() || 'Keep up the good work.';
        } catch (e) {
            console.error("OpenAI failed:", e);
            generatedFeedback = "Good effort overall, keep striving for excellence."; // Fallback
        }

        return this.prisma.grade.update({
            where: { id: gradeId },
            data: { generatedFeedback }
        });
    }

    async getStudentGrades(studentId: string, academicYearId?: string) {
        return this.prisma.grade.findMany({
            where: {
                studentId,
                ...(academicYearId ? { academicYearId } : {})
            },
            include: { subject: true }
        });
    }
}
