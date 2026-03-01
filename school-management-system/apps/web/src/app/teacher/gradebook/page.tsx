'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Clock, Calculator } from 'lucide-react';

// Mock list of subjects for demonstration
// In a real app, this would be fetched from the backend (e.g., GET /sections/assigned)
const mockSubjects = [
    { id: 'sub-1', sectionId: 'sec-1', name: 'Software Engineering II', code: 'CS302', sectionName: 'BSCS 3A', students: 42 },
    { id: 'sub-2', sectionId: 'sec-1', name: 'Data Structures & Algorithms', code: 'CS201', sectionName: 'BSCS 3A', students: 38 },
    { id: 'sub-3', sectionId: 'sec-2', name: 'Web Development', code: 'IT311', sectionName: 'BSIT 3B', students: 45 },
];

export default function GradebookHubPage() {
    const router = useRouter();
    const [subjects] = useState(mockSubjects);

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Gradebook</h1>
                <p className="text-muted-foreground">
                    Manage student grades, dynamic categories, and item scores.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((subject) => (
                    <Card key={`${subject.sectionId}-${subject.id}`} className="hover:shadow-md transition-shadow border-t-4 border-t-primary">
                        <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded">
                                    {subject.code}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium border px-2 py-1 rounded">
                                    {subject.sectionName}
                                </span>
                            </div>
                            <CardTitle className="leading-tight">{subject.name}</CardTitle>
                            <CardDescription>Record and compute item grades.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>{subject.students} Students</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                onClick={() => router.push(`/teacher/gradebook/${subject.sectionId}/${subject.id}`)}>
                                <Calculator className="w-4 h-4 mr-2" />
                                Open Gradebook
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
