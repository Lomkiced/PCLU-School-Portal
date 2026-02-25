'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { ArrowLeft, Plus, GripVertical, FileText, Video, HelpCircle, FileCheck2 } from 'lucide-react';
import { CreateContentModal } from '@/components/lms/CreateContentModal';
import { CreateQuizModal } from '@/components/lms/CreateQuizModal';

const mockCourse = {
    subjectId: 'sub-1',
    name: 'Software Engineering II',
    modules: [
        {
            id: 'm1', title: 'Unit 1: Introduction to SE', items: [
                { id: 'i1', title: 'Course Syllabus', type: 'PDF' },
                { id: 'i2', title: 'Intro Lecture', type: 'VIDEO' }
            ]
        },
        {
            id: 'm2', title: 'Unit 2: Agile Methodology', items: [
                { id: 'i3', title: 'Agile Manifesto Reading', type: 'PAGE' },
                { id: 'i4', title: 'Agile Scrum Quiz', type: 'QUIZ' },
                { id: 'i5', title: 'Sprint Backlog Creation', type: 'ASSIGNMENT' }
            ]
        }
    ]
};

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

    const [isContentModalOpen, setContentModalOpen] = useState(false);
    const [isQuizModalOpen, setQuizModalOpen] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

    const handleAddContent = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        setContentModalOpen(true);
    };

    const handleAddQuiz = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        setQuizModalOpen(true);
    };

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-5xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{mockCourse.name}</h1>
                    <p className="text-muted-foreground">Course Builder</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline"><Plus className="w-4 h-4 mr-2" /> Add Module</Button>
                </div>
            </div>

            <div className="mt-8">
                <Accordion type="multiple" defaultValue={['item-m1', 'item-m2']} className="space-y-4">
                    {mockCourse.modules.map((module) => (
                        <AccordionItem key={module.id} value={`item-${module.id}`} className="border bg-card rounded-lg shadow-sm px-4">
                            <AccordionTrigger className="hover:no-underline font-semibold text-lg py-4">
                                {module.title}
                            </AccordionTrigger>
                            <AccordionContent className="pb-6">
                                <div className="space-y-2 mb-4">
                                    {module.items.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted/40 border rounded-md group hover:bg-muted/80 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100" />
                                                {getItemIcon(item.type)}
                                                <span className="font-medium text-sm">{item.title}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono bg-background px-2 py-1 rounded border">
                                                {item.type}
                                            </div>
                                        </div>
                                    ))}
                                    {module.items.length === 0 && (
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
                    ))}
                </Accordion>
            </div>

            <CreateContentModal
                isOpen={isContentModalOpen}
                onClose={() => setContentModalOpen(false)}
                moduleId={selectedModuleId!}
            />

            <CreateQuizModal
                isOpen={isQuizModalOpen}
                onClose={() => setQuizModalOpen(false)}
                moduleId={selectedModuleId!}
            />
        </div>
    );
}
