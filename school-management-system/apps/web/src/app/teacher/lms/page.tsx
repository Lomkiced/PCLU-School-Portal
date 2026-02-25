'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Clock } from 'lucide-react';

// Mock list of subjects for demonstration
const mockSubjects = [
    { id: 'sub-1', name: 'Software Engineering II', code: 'CS302', students: 42, nextClass: '10:00 AM' },
    { id: 'sub-2', name: 'Data Structures & Algorithms', code: 'CS201', students: 38, nextClass: '1:00 PM' },
    { id: 'sub-3', name: 'Web Development', code: 'IT311', students: 45, nextClass: 'Tomorrow' },
];

export default function LmsSubjectsPage() {
    const router = useRouter();
    const [subjects] = useState(mockSubjects);

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Digital Classroom</h1>
                <p className="text-muted-foreground">
                    Manage your course materials, modules, and quizzes.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((subject) => (
                    <Card key={subject.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle>{subject.name}</CardTitle>
                                <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded">
                                    {subject.code}
                                </span>
                            </div>
                            <CardDescription>Configure course content and modules.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>{subject.students} Students</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{subject.nextClass}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                onClick={() => router.push(`/teacher/lms/${subject.id}`)}>
                                <BookOpen className="w-4 h-4 mr-2" />
                                Go to Course
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
