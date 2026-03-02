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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface AddItemModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sectionId: string;
    subjectId: string;
    academicYearId?: string;
    categories: any[];
}

export function AddItemModal({
    open,
    onOpenChange,
    sectionId,
    subjectId,
    academicYearId = 'active-academic-year',
    categories,
}: AddItemModalProps) {
    const [categoryId, setCategoryId] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [maxScore, setMaxScore] = useState('');
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/grades/item', {
                categoryId,
                name,
                maxScore: parseFloat(maxScore),
            });
            if (!res.data?.success) throw new Error('Failed to create item');
            return res.data;
        },
        onSuccess: () => {
            toast.success('Grade item created successfully');
            queryClient.invalidateQueries({
                queryKey: ['gradebookGrid', sectionId, subjectId, academicYearId],
            });
            onOpenChange(false);
            setCategoryId('');
            setName('');
            setDescription('');
            setMaxScore('');
        },
        onError: (error) => {
            console.error(error);
            toast.error('Failed to create grade item');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryId || !name || !maxScore) return;
        mutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add Grade Item</DialogTitle>
                        <DialogDescription>
                            Create a specific gradeable item (e.g., Quiz 1) under a category.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Category
                            </Label>
                            <div className="col-span-3">
                                <Select value={categoryId} onValueChange={setCategoryId} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name} ({cat.weight}%)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g. Activity 1"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="desc" className="text-right whitespace-nowrap">
                                Expiration (Opt)
                            </Label>
                            <Input
                                id="desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="col-span-3"
                                placeholder="Optional description..."
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="maxScore" className="text-right">
                                Max Score
                            </Label>
                            <Input
                                id="maxScore"
                                type="number"
                                min="1"
                                step="1"
                                value={maxScore}
                                onChange={(e) => setMaxScore(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g. 100"
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
                        <Button type="submit" disabled={mutation.isPending || !categoryId}>
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Item'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
