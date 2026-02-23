"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Users, Loader2, AlertCircle, Home, School, Plus } from "lucide-react";
import { CreateSectionModal } from "@/components/create-section-modal";

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
    sections: Section[];
    _count: { sections: number; students: number };
}

export default function GradeDetailPage() {
    const params = useParams();
    const gradeId = params.gradeId as string;
    const [grade, setGrade] = useState<GradeLevel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateSection, setShowCreateSection] = useState(false);

    const fetchGrade = () => {
        setLoading(true);
        api.get(`/grade-levels/${gradeId}`)
            .then((res) => setGrade(res.data.data))
            .catch(() => setError("Failed to load grade level"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchGrade(); }, [gradeId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        );
    }

    if (error || !grade) {
        return (
            <div className="flex items-center justify-center h-64 gap-3 text-[hsl(var(--destructive))]">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">{error || "Grade level not found"}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <Link href="/admin" className="hover:text-[hsl(var(--foreground))] transition-colors flex items-center gap-1">
                    <Home className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href="/admin/classes" className="hover:text-[hsl(var(--foreground))] transition-colors">
                    Classes
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[hsl(var(--foreground))] font-semibold">{grade.name}</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">{grade.name}</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        {grade._count.sections} section{grade._count.sections !== 1 ? "s" : ""} · {grade._count.students} student{grade._count.students !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateSection(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-all shadow-md shadow-teal-600/25"
                >
                    <Plus className="w-4 h-4" /> Create Section
                </button>
            </div>

            {/* Sections Grid */}
            {grade.sections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {grade.sections.map((section) => (
                        <Link
                            key={section.id}
                            href={`/admin/classes/${gradeId}/${section.id}`}
                            className="group bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] card-shadow hover:card-shadow-lg hover:border-[hsl(var(--primary)/0.3)] transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                                    <School className="w-5 h-5 text-[hsl(var(--primary))]" />
                                </div>
                                <ChevronRight className="w-5 h-5 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] group-hover:translate-x-1 transition-all" />
                            </div>
                            <h3 className="font-bold text-base mb-1 group-hover:text-[hsl(var(--primary))] transition-colors">
                                {grade.name} — {section.name}
                            </h3>
                            <div className="space-y-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                                <div className="flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>{section._count.students} / {section.capacity} students</span>
                                </div>
                                {section.adviser && (
                                    <p>Adviser: {section.adviser.firstName} {section.adviser.lastName}</p>
                                )}
                                {section.room && (
                                    <p>Room: {section.room.name}</p>
                                )}
                            </div>
                            {/* Capacity bar */}
                            <div className="mt-3 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[hsl(var(--primary))] transition-all"
                                    style={{ width: `${Math.min((section._count.students / section.capacity) * 100, 100)}%` }}
                                />
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))]">
                    <School className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground)/0.3)] mb-3" />
                    <p className="text-[hsl(var(--muted-foreground))] font-medium">No sections found</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground)/0.7)] mt-1">Create sections for this grade level to manage students.</p>
                </div>
            )}

            {/* Create Section Modal */}
            <CreateSectionModal
                open={showCreateSection}
                gradeId={gradeId}
                gradeName={grade.name}
                onClose={() => setShowCreateSection(false)}
                onSuccess={() => { setShowCreateSection(false); fetchGrade(); }}
            />
        </div>
    );
}
