"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Users, ChevronRight, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

interface Section {
    id: string;
    name: string;
    capacity: number;
    adviser: { firstName: string; lastName: string } | null;
    room: { name: string } | null;
    _count: { students: number };
}

interface GradeLevel {
    id: string;
    name: string;
    schoolLevel: string;
}

export default function TimetableSectionsPage() {
    const params = useParams();
    const gradeId = params.gradeId as string;

    const [gradeLevel, setGradeLevel] = useState<GradeLevel | null>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!gradeId) return;
        setLoading(true);
        Promise.all([
            api.get(`/grade-levels/${gradeId}`),
            api.get(`/sections?gradeLevelId=${gradeId}`)
        ])
            .then(([glRes, secRes]) => {
                setGradeLevel(glRes.data.data);
                // The sections API might be slightly different depending on implementation,
                // but usually the grade-levels/:id returns it, or we fetch it.
                // Assuming sections are returned from the /sections endpoint.
                setSections(secRes.data.data);
            })
            .catch(() => setError("Failed to load sections"))
            .finally(() => setLoading(false));
    }, [gradeId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        );
    }

    if (error || !gradeLevel) {
        return (
            <div className="flex items-center justify-center h-64 gap-3 text-[hsl(var(--destructive))]">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">{error || "Grade Level not found"}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/timetable"
                    className="p-2 -ml-2 rounded-xl hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-xl font-bold">{gradeLevel.name} - Sections</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        Select a section to manage its timetable
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections.map((section) => (
                    <Link
                        key={section.id}
                        href={`/admin/timetable/${gradeId}/${section.id}`}
                        className="group bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] card-shadow hover:card-shadow-lg hover:border-[hsl(var(--primary)/0.3)] transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <h3 className="font-bold text-lg group-hover:text-[hsl(var(--primary))] transition-colors">
                                    {section.name}
                                </h3>
                                <div className="space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
                                    <p className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        {section._count.students} / {section.capacity} Students
                                    </p>
                                    <p>Adviser: {section.adviser ? `${section.adviser.firstName} ${section.adviser.lastName}` : "None"}</p>
                                    <p>Room: {section.room ? section.room.name : "None"}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] group-hover:translate-x-1 transition-all" />
                        </div>
                    </Link>
                ))}
            </div>

            {sections.length === 0 && (
                <div className="text-center py-16">
                    <Users className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground)/0.3)] mb-3" />
                    <p className="text-[hsl(var(--muted-foreground))] font-medium">No sections found for {gradeLevel.name}</p>
                </div>
            )}
        </div>
    );
}
