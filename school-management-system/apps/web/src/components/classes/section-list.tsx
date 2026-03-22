"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ChevronRight, Users, Loader2, AlertCircle, School, Settings } from "lucide-react";

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        {grade.name} Sections
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                            {grade._count.sections} Total
                        </span>
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2 font-medium">
                        Managing {grade._count.students} enrolled student{grade._count.students !== 1 ? "s" : ""} across all sections
                    </p>
                </div>
            </div>

            {/* Sections Grid */}
            {grade.sections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {grade.sections.map((section, index) => (
                        <div
                            key={section.id}
                            onClick={() => onSelectSection(section.id, section.name)}
                            className="group relative cursor-pointer bg-card rounded-[1.5rem] p-1 border border-border/50 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5 overflow-hidden"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Capacity Gradient Bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-muted/50 z-10">
                                <div
                                    className="h-full bg-gradient-to-r from-primary/80 to-primary group-hover:shadow-[0_0_10px_hsl(var(--primary)/0.5)] transition-all duration-1000 ease-out relative"
                                    style={{ width: `${Math.min((section._count.students / section.capacity) * 100, 100)}%` }}
                                >
                                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 blur-[2px]" />
                                </div>
                            </div>

                            <div className="bg-background/50 backdrop-blur-sm rounded-[1.25rem] p-6 h-full flex flex-col border border-transparent group-hover:border-primary/10 transition-colors pb-8">
                                <div className="flex items-start justify-between mb-5">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-inner">
                                        <School className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>

                                <h3 className="font-extrabold text-xl mb-1 text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-1">
                                    {section.name}
                                </h3>

                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{grade.name}</span>
                                </div>

                                <div className="space-y-3 mt-auto pt-2 border-t border-border/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                            <Users className="w-4 h-4" /> Capacity
                                        </div>
                                        <div className="text-sm font-bold">
                                            <span className="text-foreground">{section._count.students}</span>
                                            <span className="text-muted-foreground"> / {section.capacity}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                            <div className="w-4 h-4 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                            </div>
                                            Adviser
                                        </div>
                                        <div className="text-sm font-semibold text-foreground truncate max-w-[120px]" title={section.adviser ? `${section.adviser.firstName} ${section.adviser.lastName}` : "Unassigned"}>
                                            {section.adviser ? `${section.adviser.lastName}` : <span className="text-muted-foreground/50 italic">None</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                            <div className="w-4 h-4 rounded-full bg-teal-500/10 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-teal-500" />
                                            </div>
                                            Room
                                        </div>
                                        <div className="text-sm font-semibold text-foreground truncate max-w-[120px]" title={section.room?.name || "Unassigned"}>
                                            {section.room ? section.room.name : <span className="text-muted-foreground/50 italic">None</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-card rounded-[2rem] border border-border border-dashed shadow-sm">
                    <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-5">
                        <School className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-foreground">No Sections Configured</h3>
                    <p className="text-muted-foreground font-medium max-w-sm mx-auto mb-6">There are no sections configured for this grade level yet. Manage academic structures in settings.</p>
                </div>
            )}
        </div>
    );
}
