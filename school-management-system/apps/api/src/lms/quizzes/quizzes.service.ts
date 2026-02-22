import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class QuizzesService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.quiz.create({
            data: {
                title: data.title,
                teacherId: data.teacherId,
                subjectId: data.subjectId,
                sectionId: data.sectionId,
                questions: data.questions, // JSON array
                totalPoints: data.totalPoints,
                deadline: new Date(data.deadline),
                status: data.status,
            }
        });
    }

    async submitQuiz(quizId: string, studentId: string, answers: any[]) {
        const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
        if (!quiz) throw new NotFoundException('Quiz not found');

        const questions: any[] = quiz.questions as any[] || [];
        let score = 0;
        let feedbackArr = [];

        // Auto-grading logic
        const requiresAiGrading = questions.some(q => q.type === 'ESSAY');

        for (const ans of answers) {
            const q = questions.find(question => question.id === ans.questionId);
            if (!q) continue;

            if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
                const isCorrect = q.correctAnswer === ans.answer;
                if (isCorrect) score += q.points;
                feedbackArr.push({ questionId: q.id, correct: isCorrect, pointsAwarded: isCorrect ? q.points : 0 });
            } else if (q.type === 'SHORT_ANSWER') {
                // Simple exact/fuzzy match
                const isCorrect = (q.correctAnswer || '').toLowerCase().trim() === (ans.answer || '').toLowerCase().trim();
                if (isCorrect) score += q.points;
                feedbackArr.push({ questionId: q.id, correct: isCorrect, pointsAwarded: isCorrect ? q.points : 0 });
            }
        }

        let submission = await this.prisma.quizSubmission.create({
            data: {
                quizId,
                studentId,
                answers, // JSON
                score,
                autoGradedFeedback: JSON.stringify(feedbackArr),
            }
        });

        if (requiresAiGrading) {
            // Typically done asynchronously in a queue, but here we do it directly for simplicity
            await this.gradeEssaysWithAI(submission.id, quizId, studentId, answers, questions);
        }

        return submission;
    }

    private async gradeEssaysWithAI(submissionId: string, quizId: string, studentId: string, answers: any[], questions: any[]) {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const submission = await this.prisma.quizSubmission.findUnique({ where: { id: submissionId } });
        if (!submission) return;
        let currentScore = submission.score;
        let currentFeedback: any[] = JSON.parse(submission.autoGradedFeedback || '[]');

        for (const ans of answers) {
            const q = questions.find(question => question.id === ans.questionId);
            if (q && q.type === 'ESSAY') {
                const prompt = `Grade this essay out of ${q.points}. Criteria: ${q.rubric || 'Accuracy and clarity'}. Essay: "${ans.answer}". Respond exactly with JSON: {"score": number, "feedback": "string"}`;

                try {
                    const res = await openai.chat.completions.create({
                        model: 'gpt-4o',
                        messages: [{ role: 'user', content: prompt }],
                        response_format: { type: "json_object" },
                    });

                    const result = JSON.parse(res.choices[0]?.message?.content || '{}');
                    const awarded = result.score || 0;
                    currentScore += awarded;
                    currentFeedback.push({
                        questionId: q.id,
                        pointsAwarded: awarded,
                        feedback: result.feedback
                    });
                } catch (e) {
                    console.error("AI grading failed", e);
                    currentFeedback.push({ questionId: q.id, pointsAwarded: 0, feedback: 'AI Grading failed. Manual review required.' });
                }
            }
        }

        await this.prisma.quizSubmission.update({
            where: { id: submissionId },
            data: {
                score: currentScore,
                autoGradedFeedback: JSON.stringify(currentFeedback),
            }
        });
    }

    async findAll(sectionId: string, subjectId: string) {
        return this.prisma.quiz.findMany({
            where: { sectionId, subjectId }
        });
    }
}
