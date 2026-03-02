'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CreateQuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    moduleId?: string;
    subjectId: string;
}

export function CreateQuizModal({ isOpen, onClose, moduleId, subjectId }: CreateQuizModalProps) {
    const { register, control, handleSubmit, reset } = useForm({
        defaultValues: {
            title: '',
            questions: [{ text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', points: 1 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "questions"
    });

    const queryClient = useQueryClient();

    const createQuizMutation = useMutation({
        mutationFn: async (data: any) => {
            // Transform quiz questions to store in attachments
            const totalPoints = data.questions.reduce((sum: number, q: any) => sum + Number(q.points), 0);

            const res = await api.post(`/lms/modules/${moduleId}/items`, {
                title: data.title,
                type: 'QUIZ',
                attachments: {
                    questions: data.questions,
                    totalPoints
                }
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success('Quiz created successfully!');
            queryClient.invalidateQueries({ queryKey: ['course', subjectId] });
            reset();
            onClose();
        },
        onError: () => {
            toast.error('Failed to create quiz.');
        }
    });

    const onSubmit = (data: any) => {
        if (!moduleId) return;
        createQuizMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Build a Quiz</DialogTitle>
                    <DialogDescription>
                        Create dynamic multiple-choice questions for your students.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-4 space-y-6 mt-4 pb-4">
                    <form id="quizForm" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-2">
                            <Label htmlFor="quizTitle">Quiz Title</Label>
                            <Input id="quizTitle" placeholder="e.g., Unit 1 End of Chapter Quiz" {...register('title', { required: true })} />
                        </div>

                        <div className="space-y-6">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-lg bg-muted/20 relative">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-semibold text-sm">Question {index + 1}</h4>
                                        {fields.length > 1 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="text-red-500 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <Input placeholder="Enter question text here..." {...register(`questions.${index}.text`, { required: true })} />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold w-6">A.</span>
                                                <Input placeholder="Option A" {...register(`questions.${index}.optionA`, { required: true })} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold w-6">B.</span>
                                                <Input placeholder="Option B" {...register(`questions.${index}.optionB`, { required: true })} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold w-6">C.</span>
                                                <Input placeholder="Option C" {...register(`questions.${index}.optionC`, { required: true })} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold w-6">D.</span>
                                                <Input placeholder="Option D" {...register(`questions.${index}.optionD`, { required: true })} />
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="w-1/2 space-y-2">
                                                <Label>Correct Answer</Label>
                                                <select
                                                    {...register(`questions.${index}.correctAnswer`)}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                >
                                                    <option value="A">Option A</option>
                                                    <option value="B">Option B</option>
                                                    <option value="C">Option C</option>
                                                    <option value="D">Option D</option>
                                                </select>
                                            </div>
                                            <div className="w-1/2 space-y-2">
                                                <Label>Points</Label>
                                                <Input type="number" min="1" {...register(`questions.${index}.points`)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => append({ text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', points: 1 })}>
                            <Plus className="w-4 h-4 mr-2" /> Add Next Question
                        </Button>
                    </form>
                </div>

                <DialogFooter className="pt-4 border-t mt-auto">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={createQuizMutation.isPending}>Cancel</Button>
                    <Button type="submit" form="quizForm" disabled={createQuizMutation.isPending}>
                        {createQuizMutation.isPending ? 'Saving...' : 'Save Quiz'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
