"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, School, BookOpen, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";

const fetchMySections = async (token: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/teachers/me/classes`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) throw new Error("Failed to fetch my classes");
    const json = await res.json();
    return json.data;
};

export default function MyClassesPage() {
    const { accessToken } = useAuthStore();
    const { data: sections, isLoading, isError } = useQuery({
        queryKey: ["teacher-sections", accessToken],
        queryFn: () => fetchMySections(accessToken!),
        enabled: !!accessToken,
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Classes</h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                    Manage your assigned sections and subjects.
                </p>
            </div>

            {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
                            <Skeleton className="h-6 w-32 mb-4" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-4/5" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : isError ? (
                <div className="bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))] rounded-2xl p-6 text-center border border-[hsl(var(--destructive)/0.2)]">
                    <p>Failed to load classes. Please try again later.</p>
                </div>
            ) : !sections || sections.length === 0 ? (
                <div className="bg-[hsl(var(--card))] rounded-2xl p-12 text-center border border-[hsl(var(--border))]">
                    <School className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50 mb-4" />
                    <h3 className="text-lg font-semibold">No Classes Assigned</h3>
                    <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
                        You have not been assigned to any sections yet for the current grading period.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {sections.map((section) => (
                        <Link
                            key={section.id}
                            href={`/teacher/classes/${section.id}`}
                            className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))] card-shadow hover:card-shadow-lg transition-all group hover:-translate-y-1 block relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-[hsl(var(--primary))]" />
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <span className="inline-flex items-center rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] px-2.5 py-1 text-xs font-semibold mb-2">
                                        {section.gradeLevel}
                                    </span>
                                    <h3 className="text-xl font-bold tracking-tight group-hover:text-[hsl(var(--primary))] transition-colors">
                                        {section.name}
                                    </h3>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--secondary)/0.1)] flex items-center justify-center text-[hsl(var(--secondary))] transition-colors group-hover:bg-[hsl(var(--secondary))] group-hover:text-white">
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="space-y-3 mt-4 pt-4 border-t border-[hsl(var(--border))]">
                                <div className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center">
                                        <BookOpen className="w-4 h-4 text-[hsl(var(--primary))]" />
                                    </div>
                                    <span className="font-medium truncate">{section.subjectTaught}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center">
                                        <Users className="w-4 h-4 text-[hsl(var(--secondary))]" />
                                    </div>
                                    <span className="font-medium">{section.studentsCount} Students Enrolled</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-[hsl(var(--info))]" />
                                    </div>
                                    <span className="font-medium">{section.schedule} • {section.roomNumber}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
