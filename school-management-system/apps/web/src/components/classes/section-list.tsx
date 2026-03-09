"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ChevronRight, Users, Loader2, AlertCircle, School, Plus } from "lucide-react";
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

interface SectionListProps {
    gradeId: string;
    onSelectSection: (sectionId: string, sectionName: string) => void;
}

export function SectionList({ gradeId, onSelectSection }: SectionListProps) {
    const [grade, setGrade] = useState<GradeLevel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateSection, setShowCreateSection] = useState(false);

    const fetchGrade = () => {
        setLoading(true);
        api.get(`/grade-levels/${gradeId}`)
            .then((res) => setGrade(res.data.data))
            .catch(() => setError("Failed to load grade level details"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (gradeId) {
            fetchGrade();
        }
    }, [gradeId]);

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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">{grade.name} Sections</h2>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {grade.sections.map((section) => (
                        <div
                            key={section.id}
                            onClick={() => onSelectSection(section.id, section.name)}
                            className="group cursor-pointer bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] box-shadow-sm hover:box-shadow-md hover:border-[hsl(var(--primary)/0.3)] hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                                    <School className="w-5 h-5 text-[hsl(var(--primary))]" />
                                </div>
                                <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center group-hover:bg-[hsl(var(--primary)/0.1)] transition-colors">
                                    <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </div>
                            <h3 className="font-bold text-lg mb-1 group-hover:text-[hsl(var(--primary))] transition-colors">
                                {grade.name} — {section.name}
                            </h3>
                            <div className="space-y-2 mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                                <div className="flex items-center justify-between bg-[hsl(var(--muted)/0.5)] px-3 py-1.5 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        <span className="font-medium">Students</span>
                                    </div>
                                    <span className="font-bold text-[hsl(var(--foreground))]">{section._count.students} / {section.capacity}</span>
                                </div>

                                <div className="px-1 text-xs space-y-1">
                                    {section.adviser ? (
                                        <p><span className="opacity-70">Adviser:</span> <span className="font-medium text-[hsl(var(--foreground))]">{section.adviser.firstName} {section.adviser.lastName}</span></p>
                                    ) : (
                                        <p className="opacity-50 italic">No adviser assigned</p>
                                    )}
                                    {section.room ? (
                                        <p><span className="opacity-70">Room:</span> <span className="font-medium text-[hsl(var(--foreground))]">{section.room.name}</span></p>
                                    ) : (
                                        <p className="opacity-50 italic">No room assigned</p>
                                    )}
                                </div>
                            </div>

                            {/* Capacity progress */}
                            <div className="mt-4 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min((section._count.students / section.capacity) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm">
                    <div className="w-16 h-16 bg-[hsl(var(--primary)/0.05)] rounded-full flex items-center justify-center mx-auto mb-4">
                        <School className="w-8 h-8 text-[hsl(var(--muted-foreground)/0.5)]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--foreground))]">No sections found</h3>
                    <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">Create sections for this grade level to start enrolling students and assigning classes.</p>
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
