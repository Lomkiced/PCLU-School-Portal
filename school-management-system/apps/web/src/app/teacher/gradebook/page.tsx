'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Clock, Calculator, School } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

export default function GradebookHubPage() {
    const router = useRouter();
    const { accessToken } = useAuthStore();

    const { data: subjects, isLoading, isError } = useQuery({
        queryKey: ['teacher-gradebook-subjects', accessToken],
        queryFn: async () => {
            const res = await api.get('/teachers/me/classes');
            if (!res.data?.success) throw new Error('Failed to fetch subjects');
            return res.data.data;
        },
        enabled: !!accessToken,
    });

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Gradebook</h1>
                <p className="text-muted-foreground">
                    Manage student grades, dynamic categories, and item scores.
                </p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="hover:shadow-md transition-shadow border-t-4 border-t-primary">
                            <CardHeader>
                                <Skeleton className="h-4 w-1/4 mb-2" />
                                <Skeleton className="h-6 w-3/4 mb-1" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-1/3" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-10 w-full" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : isError ? (
                <div className="bg-destructive/10 text-destructive rounded-2xl p-6 text-center border border-destructive/20">
                    <p>Failed to load subjects. Please try again later.</p>
                </div>
            ) : !subjects || subjects.length === 0 ? (
                <div className="bg-card rounded-2xl p-12 text-center border">
                    <School className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-semibold">No Subjects Assigned</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                        You have not been assigned to any subjects yet for the current grading period.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.map((subject: any) => {
                        // subjectTaught string format happens to be `CODE - Name`
                        const [code, ...nameParts] = subject.subjectTaught.split(' - ');
                        const name = nameParts.join(' - ');

                        return (
                            <Card key={`${subject.id}-${subject.subjectId}`} className="hover:shadow-md transition-shadow border-t-4 border-t-primary flex flex-col">
                                <CardHeader>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded">
                                            {code}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-medium border px-2 py-1 rounded">
                                            {subject.name}
                                        </span>
                                    </div>
                                    <CardTitle className="leading-tight">{name || subject.subjectTaught}</CardTitle>
                                    <CardDescription>Record and compute item grades.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            <span>{subject.studentsCount} Students</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="mt-auto">
                                    <Button
                                        className="w-full"
                                        onClick={() => router.push(`/teacher/gradebook/${subject.id}/${subject.subjectId}?academicYearId=${subject.academicYearId}`)}>
                                        <Calculator className="w-4 h-4 mr-2" />
                                        Open Gradebook
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
