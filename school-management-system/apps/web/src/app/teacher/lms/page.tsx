'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function LmsSubjectsPage() {
    const router = useRouter();

    const { data: response, isLoading, isError } = useQuery({
        queryKey: ['teacher-classes'],
        queryFn: async () => {
            const res = await api.get('/teachers/me/classes');
            return res.data;
        }
    });

    const classes = response?.data || [];

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Digital Classroom</h1>
                <p className="text-muted-foreground">
                    Manage your course materials, modules, and quizzes.
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : isError ? (
                <div className="flex justify-center items-center py-12 text-destructive gap-2">
                    <AlertCircle className="w-6 h-6" />
                    <span>Failed to load classes. Please try again.</span>
                </div>
            ) : classes.length === 0 ? (
                <div className="flex justify-center items-center py-12 text-muted-foreground">
                    No classes assigned yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls: any) => (
                        <Card key={cls.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle>{cls.subjectTaught}</CardTitle>
                                    <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded">
                                        {cls.name}
                                    </span>
                                </div>
                                <CardDescription>Configure course content and modules.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        <span>{cls.studentsCount} Students</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{cls.schedule}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    onClick={() => router.push(`/teacher/lms/${cls.subjectId}`)}>
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    Go to Course
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
