'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface EditableCellProps {
    initialValue: number | null;
    studentId: string;
    gradeItemId: string;
    onSaveSuccess?: () => void;
    academicYearId?: string;
    sectionId: string;
    subjectId: string;
}

export default function EditableCell({
    initialValue,
    studentId,
    gradeItemId,
    onSaveSuccess,
    academicYearId = 'active-academic-year',
    sectionId,
    subjectId
}: EditableCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState<string>(initialValue !== null ? String(initialValue) : '');
    const inputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    // The key that uniquely identifies the gradebook grid data
    const queryKey = ['gradebookGrid', sectionId, subjectId, academicYearId];

    const mutation = useMutation({
        mutationFn: async (newValue: number | null) => {
            if (newValue === null) {
                // Assuming there's a delete or we just upsert null/0 based on backend support
                // For now we'll push 0 if it's cleared, or ideally call a delete endpoint
                // Adjust this depending on your actual API capability. Standard upsert:
                const res = await api.post('/grades/upsert', {
                    studentId,
                    gradeItemId,
                    score: 0
                });
                if (!res.data?.success) throw new Error('Failed to save grade');
                return res.data;
            }

            const res = await api.post('/grades/upsert', {
                studentId,
                gradeItemId,
                score: newValue
            });
            if (!res.data?.success) throw new Error('Failed to save grade');
            return res.data;
        },
        onMutate: async (newScore) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey });

            // Snapshot the previous value
            const previousData = queryClient.getQueryData<any>(queryKey);

            // Optimistically update to the new value
            if (previousData) {
                queryClient.setQueryData(queryKey, (old: any) => {
                    if (!old) return old;

                    // Deep copy or structured clone might be better depending on size, 
                    // but we'll map the itemGrades array
                    const itemGrades = [...(old.itemGrades || [])];
                    const existingIndex = itemGrades.findIndex(
                        (g) => g.studentId === studentId && g.gradeItemId === gradeItemId
                    );

                    if (existingIndex >= 0) {
                        if (newScore === null) {
                            // remove it or set to 0
                            itemGrades[existingIndex] = { ...itemGrades[existingIndex], score: 0 };
                        } else {
                            itemGrades[existingIndex] = { ...itemGrades[existingIndex], score: newScore };
                        }
                    } else if (newScore !== null) {
                        // Add new
                        itemGrades.push({ studentId, gradeItemId, score: newScore });
                    }

                    return { ...old, itemGrades };
                });
            }

            // Return a context object with the snapshotted value
            return { previousData };
        },
        onError: (err, newScore, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousData) {
                queryClient.setQueryData(queryKey, context.previousData);
            }
            toast.error('Failed to save grade');
            setValue(initialValue !== null ? String(initialValue) : '');
        },
        onSettled: () => {
            // Always refetch after error or success to ensure server sync
            // Commenting this out for "silent" background updates if preferred,
            // but usually good to ensure consistency.
            // queryClient.invalidateQueries({ queryKey });
            if (onSaveSuccess) onSaveSuccess();
        }
    });

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Keep local state in sync if initialValue changes from outside
    useEffect(() => {
        if (!isEditing) {
            setValue(initialValue !== null ? String(initialValue) : '');
        }
    }, [initialValue, isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        const parsed = parseFloat(value);
        const numValue = isNaN(parsed) ? null : parsed;

        if (numValue !== initialValue) {
            mutation.mutate(numValue);
        } else {
            setValue(initialValue !== null ? String(initialValue) : '');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setValue(initialValue !== null ? String(initialValue) : '');
        }
    };

    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                type="number"
                className="w-full h-8 px-1 py-0 text-center rounded-sm text-sm border-blue-500 ring-1 ring-blue-500 outline-none"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
            />
        );
    }

    return (
        <div
            className={`w-full h-full min-h-[32px] flex justify-center items-center cursor-text hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors rounded-sm ${mutation.isError ? 'bg-red-50 text-red-500' : ''}`}
            onClick={() => setIsEditing(true)}
            title={mutation.isError ? "Failed to save" : ""}
        >
            {value !== '' ? value : <span className="text-transparent selection:text-transparent">-</span>}
        </div>
    );
}
