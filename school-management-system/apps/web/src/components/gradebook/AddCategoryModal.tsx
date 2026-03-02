import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface AddCategoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sectionId: string;
    subjectId: string;
    academicYearId?: string;
}

export function AddCategoryModal({
    open,
    onOpenChange,
    sectionId,
    subjectId,
    academicYearId = 'active-academic-year',
}: AddCategoryModalProps) {
    const [name, setName] = useState('');
    const [weight, setWeight] = useState('');
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/grades/category', {
                sectionId,
                subjectId,
                academicYearId,
                name,
                weight: parseFloat(weight),
            });
            if (!res.data?.success) throw new Error('Failed to create category');
            return res.data;
        },
        onSuccess: () => {
            toast.success('Category created successfully');
            queryClient.invalidateQueries({
                queryKey: ['gradebookGrid', sectionId, subjectId, academicYearId],
            });
            onOpenChange(false);
            setName('');
            setWeight('');
        },
        onError: (error) => {
            console.error(error);
            toast.error('Failed to create category');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !weight) return;
        mutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add Category</DialogTitle>
                        <DialogDescription>
                            Create a new grading category (e.g., Quizzes, Exams).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g. Quizzes"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="weight" className="text-right">
                                Weight (%)
                            </Label>
                            <Input
                                id="weight"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g. 40"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={mutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Category'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
