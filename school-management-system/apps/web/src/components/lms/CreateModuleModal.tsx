'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CreateModuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    subjectId: string;
}

export function CreateModuleModal({ isOpen, onClose, courseId, subjectId }: CreateModuleModalProps) {
    const { register, handleSubmit, reset } = useForm();
    const queryClient = useQueryClient();

    const createModuleMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/lms/modules', {
                ...data,
                courseId,
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success('Module created successfully');
            queryClient.invalidateQueries({ queryKey: ['course', subjectId] });
            reset();
            onClose();
        },
        onError: () => {
            toast.error('Failed to create module');
        }
    });

    const onSubmit = (data: any) => {
        createModuleMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Module</DialogTitle>
                    <DialogDescription>
                        Modules help organize your course content into sections or weeks.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Module Title</Label>
                        <Input id="title" placeholder="e.g., Week 1: Introduction" {...register('title', { required: true })} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Briefly describe what this module covers..."
                            className="min-h-[100px]"
                            {...register('description')}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={createModuleMutation.isPending}>Cancel</Button>
                        <Button type="submit" disabled={createModuleMutation.isPending}>
                            {createModuleMutation.isPending ? 'Creating...' : 'Create Module'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
