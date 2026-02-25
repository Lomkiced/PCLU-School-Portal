'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip } from 'lucide-react';

interface CreateContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    moduleId?: string;
}

export function CreateContentModal({ isOpen, onClose, moduleId }: CreateContentModalProps) {
    const { register, handleSubmit, reset } = useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        // Simulate API Call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Submitted Content:', { ...data, moduleId });
        setIsSubmitting(false);
        reset();
        onClose();
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
                            <option value="VIDEO">Video Embed</option>
                            <option value="PDF">PDF Material</option>
                            <option value="ASSIGNMENT">Assignment Upload</option>
                        </select>
                    </div>

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
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Create Content'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
