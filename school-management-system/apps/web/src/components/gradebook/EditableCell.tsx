'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

interface EditableCellProps {
    initialValue: number | null;
    studentId: string;
    gradeItemId: string;
    onSaveSuccess?: () => void;
}

export default function EditableCell({ initialValue, studentId, gradeItemId, onSaveSuccess }: EditableCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState<string>(initialValue !== null ? String(initialValue) : '');
    const inputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (newValue: number) => {
            const res = await api.post('/grades/upsert', {
                studentId,
                gradeItemId,
                score: newValue
            });
            if (!res.data?.success) throw new Error('Failed to save grade');
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gradebook'] });
            if (onSaveSuccess) onSaveSuccess();
        },
        onError: (err) => {
            console.error(err);
            setValue(initialValue !== null ? String(initialValue) : '');
        }
    });

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        const numValue = value === '' ? null : parseFloat(value);
        if (numValue !== null && numValue !== initialValue) {
            mutation.mutate(numValue);
        } else if (numValue === null && initialValue !== null) {
            // Depending on requirements, we might want to delete the grade, but upsert with 0 might suffice for now
            setValue(String(initialValue));
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

    if (mutation.isPending) {
        return (
            <div className="flex justify-center items-center h-full w-full">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
        );
    }

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
            className="w-full h-full min-h-[32px] flex justify-center items-center cursor-text hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors rounded-sm"
            onClick={() => setIsEditing(true)}
        >
            {value !== '' ? value : <span className="text-transparent selection:text-transparent">-</span>}
        </div>
    );
}
