"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ScanLine, BookOpen, ChevronLeft, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";

// Mock data fetching
const fetchSectionDetails = async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
        id,
        name: "BSIT-2A",
        gradeLevel: "2nd Year",
        subjectTaught: "CS101 - Intro to Programming",
        roomNumber: "Lab 1",
        schedule: "Mon/Wed 8:00 AM"
    };
};

const fetchStudents = async (sectionId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return [
        { id: "S-2023-001", name: "Maria Santos", gender: "Female", email: "maria@example.com" },
        { id: "S-2023-002", name: "Juan Dela Cruz", gender: "Male", email: "juan@example.com" },
        { id: "S-2023-003", name: "Ana Garcia", gender: "Female", email: "ana@example.com" },
        { id: "S-2023-004", name: "Pedro Reyes", gender: "Male", email: "pedro@example.com" },
    ];
};

export default function ClassDrillDownPage() {
    const params = useParams();
    const sectionId = params.sectionId as string;

    const { data: section, isLoading: isLoadingSection } = useQuery({
        queryKey: ["section", sectionId],
        queryFn: () => fetchSectionDetails(sectionId),
    });

    const { data: students, isLoading: isLoadingStudents } = useQuery({
        queryKey: ["section-students", sectionId],
        queryFn: () => fetchStudents(sectionId),
    });

    const studentColumns = [
        { label: "Student ID", key: "id" },
        { label: "Name", key: "name" },
        { label: "Gender", key: "gender" },
        { label: "Email", key: "email" },
    ];

    if (isLoadingSection) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        );
    }

    if (!section) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Section Not Found</h2>
                <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm">
                    The requested class section doesn't exist or you don't have access to it.
                </p>
                <Link href="/teacher/classes" className="text-[hsl(var(--primary))] hover:underline mt-4 inline-block font-semibold">
                    ← Back to My Classes
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Link href="/teacher/classes" className="inline-flex items-center text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to My Classes
            </Link>

            <div className="bg-[hsl(var(--card))] rounded-2xl p-6 md:p-8 card-shadow border border-[hsl(var(--border))] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[hsl(var(--primary)/0.1)] to-transparent rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="inline-flex items-center rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] px-3 py-1 text-xs font-bold uppercase tracking-wider">
                                {section.gradeLevel}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-[hsl(var(--info)/0.1)] text-[hsl(var(--info))] px-3 py-1 text-xs font-bold uppercase tracking-wider">
                                {section.roomNumber}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{section.name}</h1>
                        <p className="text-[hsl(var(--muted-foreground))] mt-2 font-medium">
                            {section.subjectTaught} • {section.schedule}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <div className="bg-[hsl(var(--background))] px-4 py-3 rounded-xl border border-[hsl(var(--border))] text-center min-w-[100px]">
                            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-semibold">Students</p>
                            <p className="text-xl font-bold mt-1">{students?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="roster" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 mb-6 bg-[hsl(var(--muted)/0.5)] p-1 rounded-xl">
                    <TabsTrigger value="roster" className="rounded-lg font-medium">
                        <Users className="w-4 h-4 mr-2" /> Roster
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="rounded-lg font-medium">
                        <ScanLine className="w-4 h-4 mr-2" /> Attendance
                    </TabsTrigger>
                    <TabsTrigger value="subjects" className="rounded-lg font-medium">
                        <BookOpen className="w-4 h-4 mr-2" /> Subjects
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="roster" className="mt-0">
                    <div className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))]">
                        <h3 className="text-xl font-bold mb-6">Class Roster</h3>
                        {isLoadingStudents ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                            </div>
                        ) : students && students.length > 0 ? (
                            <DataTable columns={studentColumns} data={students} />
                        ) : (
                            <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                                <Users className="w-12 h-12 mx-auto opacity-20 mb-4" />
                                <p>No students enrolled in this section yet.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="attendance" className="mt-0">
                    <div className="bg-[hsl(var(--card))] rounded-2xl p-6 md:p-10 card-shadow border border-[hsl(var(--border))] flex flex-col items-center justify-center text-center min-h-[400px]">
                        <div className="w-20 h-20 bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] rounded-3xl flex items-center justify-center mb-6 rotate-3">
                            <CalendarCheck className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight mb-2">Daily Attendance</h3>
                        <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto mb-8">
                            Select a date to mark attendance for all students in {section.name}.
                        </p>
                        <button className="bg-[hsl(var(--primary))] text-primary-foreground hover:bg-[hsl(var(--primary)/0.9)] px-6 py-3 rounded-xl font-semibold shadow-sm shadow-[hsl(var(--primary)/0.3)] transition-all active:scale-95">
                            Mark Today's Attendance
                        </button>
                    </div>
                </TabsContent>

                <TabsContent value="subjects" className="mt-0">
                    <div className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))]">
                        <h3 className="text-xl font-bold mb-6">Assigned Subjects</h3>
                        <div className="border border-[hsl(var(--border))] rounded-xl divide-y divide-[hsl(var(--border))]">
                            <div className="p-4 flex items-center justify-between hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-[hsl(var(--primary))]" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{section.subjectTaught}</p>
                                        <p className="text-sm text-[hsl(var(--muted-foreground))]">{section.schedule}</p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] px-2.5 py-1 text-xs font-semibold">
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
