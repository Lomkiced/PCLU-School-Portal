'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Link as LinkIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CreateContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    moduleId?: string;
    subjectId: string;
}

export function CreateContentModal({ isOpen, onClose, moduleId, subjectId }: CreateContentModalProps) {
    const { register, handleSubmit, reset, watch } = useForm({
        defaultValues: {
            title: '',
            type: 'PAGE',
            body: '',
            resourceUrl: ''
        }
    });

    const queryClient = useQueryClient();
    const selectedType = watch('type');

    const createItemMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post(`/lms/modules/${moduleId}/items`, {
                title: data.title,
                type: data.type,
                body: data.body,
                attachments: data.resourceUrl ? { url: data.resourceUrl } : null
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success('Activity created successfully!');
            queryClient.invalidateQueries({ queryKey: ['course', subjectId] });
            reset();
            onClose();
        },
        onError: () => {
            toast.error('Failed to create activity.');
        }
    });

    const onSubmit = (data: any) => {
        if (!moduleId) return;
        createItemMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Add Activity or Lesson</DialogTitle>
                    <DialogDescription>
                        Create a rich-text lesson, embed a video, or upload a PDF assignment to this module.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Lesson / Activity Title</Label>
                        <Input id="title" placeholder="e.g., Introduction to React Setup" {...register('title', { required: true })} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Content Type</Label>
                        <select
                            id="type"
                            {...register('type', { required: true })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="PAGE">Rich Text Page</option>
                            <option value="VIDEO">Video Link (YouTube/Vimeo)</option>
                            <option value="PDF">PDF Material / External Link</option>
                            <option value="ASSIGNMENT">Assignment Upload</option>
                        </select>
                    </div>

                    {(selectedType === 'VIDEO' || selectedType === 'PDF' || selectedType === 'ASSIGNMENT') && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label htmlFor="resourceUrl">Resource URL (Link to Video or File)</Label>
                            <div className="flex items-center gap-2">
                                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                                <Input id="resourceUrl" placeholder="https://..." {...register('resourceUrl')} className="flex-1" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Leave blank to rely strictly on the Rich Text content manually written above.
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="body">Content Body (Rich Text Placeholder)</Label>
                        <Textarea
                            id="body"
                            placeholder="Write out your lesson or embed code here..."
                            className="min-h-[200px]"
                            {...register('body')}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => alert('Trigger File Upload Service')}>
                            <Paperclip className="w-4 h-4 mr-2" />
                            Attach File
                        </Button>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={createItemMutation.isPending}>Cancel</Button>
                        <Button type="submit" disabled={createItemMutation.isPending}>
                            {createItemMutation.isPending ? 'Saving...' : 'Create Content'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
