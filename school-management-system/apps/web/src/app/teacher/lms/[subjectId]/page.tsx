'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { ArrowLeft, Plus, GripVertical, FileText, Video, HelpCircle, FileCheck2 } from 'lucide-react';
import { CreateContentModal } from '@/components/lms/CreateContentModal';
import { CreateQuizModal } from '@/components/lms/CreateQuizModal';
import { CreateModuleModal } from '@/components/lms/CreateModuleModal';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2, AlertCircle } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableModule } from '@/components/lms/SortableModule';
import { SortableItem } from '@/components/lms/SortableItem';
import { toast } from 'sonner';

const getItemIcon = (type: string) => {
    switch (type) {
        case 'VIDEO': return <Video className="w-4 h-4 text-blue-500" />;
        case 'PDF': return <FileText className="w-4 h-4 text-red-500" />;
        case 'QUIZ': return <HelpCircle className="w-4 h-4 text-purple-500" />;
        case 'ASSIGNMENT': return <FileCheck2 className="w-4 h-4 text-orange-500" />;
        default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
};

export default function CourseBuilderPage() {
    const router = useRouter();
    const params = useParams();
    const queryClient = useQueryClient();

    const [modules, setModules] = useState<any[]>([]);

    const { data: course, isLoading, isError } = useQuery({
        queryKey: ['course', params.subjectId],
        queryFn: async () => {
            const res = await api.get(`/lms/courses/${params.subjectId}`);
            setModules(res.data?.modules || []);
            return res.data;
        },
        enabled: !!params.subjectId,
    });

    const reorderModulesMutation = useMutation({
        mutationFn: async (moduleIds: string[]) => {
            const res = await api.patch('/lms/modules/reorder', { moduleIds });
            return res.data;
        },
        onError: () => {
            toast.error('Failed to save module order.');
            // Revert optimistic update
            setModules(course?.modules || []);
        }
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before dragging starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setModules((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Fire mutation to save to backend
                reorderModulesMutation.mutate(newOrder.map(m => m.id));

                return newOrder;
            });
        }
    };

    const [isContentModalOpen, setContentModalOpen] = useState(false);
    const [isQuizModalOpen, setQuizModalOpen] = useState(false);
    const [isCreateModuleModalOpen, setCreateModuleModalOpen] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

    const handleAddContent = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        setContentModalOpen(true);
    };

    const handleAddQuiz = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        setQuizModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError || !course) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-2 text-destructive">
                <AlertCircle className="w-8 h-8" />
                <p>Failed to load course details. Make sure the course exists.</p>
                <Button variant="outline" onClick={() => router.back()} className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-5xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{course?.subject?.name || 'Untitled Course'}</h1>
                    <p className="text-muted-foreground">Course Builder</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" onClick={() => setCreateModuleModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Module
                    </Button>
                </div>
            </div>

            <div className="mt-8">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={modules.map(m => m.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <Accordion type="multiple" defaultValue={modules?.map((m: any) => `item-${m.id}`) || []} className="space-y-4">
                            {modules?.map((module: any) => (
                                <SortableModule key={module.id} id={module.id}>
                                    {(sortableProps) => (
                                        <div
                                            ref={sortableProps.setNodeRef}
                                            style={sortableProps.style}
                                            className="relative"
                                        >
                                            <div
                                                {...sortableProps.attributes}
                                                {...sortableProps.listeners}
                                                className="absolute top-4 right-12 z-10 cursor-grab p-2 hover:bg-muted rounded text-muted-foreground opacity-50 hover:opacity-100 transition-all"
                                            >
                                                <GripVertical className="w-5 h-5" />
                                            </div>
                                            <AccordionItem value={`item-${module.id}`} className="border bg-card rounded-lg shadow-sm px-4">
                                                <AccordionTrigger className="hover:no-underline font-semibold text-lg py-4 pr-16 bg-transparent">
                                                    {module.title}
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-6">
                                                    <div className="space-y-2 mb-4">
                                                        {module.items?.map((item: any) => (
                                                            <div key={item.id} className="flex items-center justify-between p-3 bg-muted/40 border rounded-md group hover:bg-muted/80 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <GripVertical className="w-4 h-4 text-muted-foreground opacity-50" />
                                                                    {getItemIcon(item.type)}
                                                                    <span className="font-medium text-sm">{item.title}</span>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground font-mono bg-background px-2 py-1 rounded border">
                                                                    {item.type}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {(!module.items || module.items.length === 0) && (
                                                            <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-md">
                                                                No items in this module yet.
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Button variant="secondary" size="sm" onClick={() => handleAddContent(module.id)}>
                                                            <Plus className="w-4 h-4 mr-2" /> Add Activity / Lesson
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => handleAddQuiz(module.id)}>
                                                            <HelpCircle className="w-4 h-4 mr-2" /> Add Quiz
                                                        </Button>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </div>
                                    )}
                                </SortableModule>
                            ))}
                        </Accordion>
                    </SortableContext>
                </DndContext>
            </div>

            <CreateContentModal
                isOpen={isContentModalOpen}
                onClose={() => setContentModalOpen(false)}
                moduleId={selectedModuleId!}
                subjectId={params.subjectId as string}
            />

            <CreateQuizModal
                isOpen={isQuizModalOpen}
                onClose={() => setQuizModalOpen(false)}
                moduleId={selectedModuleId!}
                subjectId={params.subjectId as string}
            />

            <CreateModuleModal
                isOpen={isCreateModuleModalOpen}
                onClose={() => setCreateModuleModalOpen(false)}
                courseId={course?.id}
                subjectId={params.subjectId as string}
            />
        </div>
    );
}
