"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { School, Users, ChevronRight, Loader2, AlertCircle } from "lucide-react";

interface GradeLevel {
    id: string;
    name: string;
    schoolLevel: string;
    _count: { sections: number; students: number };
}

const schoolLevelColors: Record<string, string> = {
    KINDER: "bg-pink-500/10 text-pink-500",
    ELEM: "bg-green-500/10 text-green-500",
    JHS: "bg-blue-500/10 text-blue-500",
    SHS: "bg-purple-500/10 text-purple-500",
};

const schoolLevelLabels: Record<string, string> = {
    KINDER: "Kindergarten",
    ELEM: "Elementary",
    JHS: "Junior High School",
    SHS: "Senior High School",
};

export default function ClassesPage() {
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get("/grade-levels")
            .then((res) => setGradeLevels(res.data.data))
            .catch(() => setError("Failed to load grade levels"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64 gap-3 text-[hsl(var(--destructive))]">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">{error}</p>
            </div>
        );
    }

    // Group by school level
    const grouped = gradeLevels.reduce<Record<string, GradeLevel[]>>((acc, gl) => {
        const level = gl.schoolLevel;
        if (!acc[level]) acc[level] = [];
        acc[level].push(gl);
        return acc;
    }, {});

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold">Class Management</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                    Browse grade levels, sections, and enrolled students
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] card-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                            <School className="w-5 h-5 text-[hsl(var(--primary))]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{gradeLevels.length}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Grade Levels</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] card-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                            <School className="w-5 h-5 text-teal-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {gradeLevels.reduce((a, g) => a + g._count.sections, 0)}
                            </p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Sections</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] card-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {gradeLevels.reduce((a, g) => a + g._count.students, 0)}
                            </p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Students</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grade Level Cards grouped by School Level */}
            {Object.entries(grouped).map(([level, grades]) => (
                <div key={level} className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${schoolLevelColors[level] || "bg-gray-500/10 text-gray-500"}`}>
                            {schoolLevelLabels[level] || level}
                        </span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {grades.length} grade level{grades.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {grades.map((gl) => (
                            <Link
                                key={gl.id}
                                href={`/admin/classes/${gl.id}`}
                                className="group bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] card-shadow hover:card-shadow-lg hover:border-[hsl(var(--primary)/0.3)] transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-base group-hover:text-[hsl(var(--primary))] transition-colors">
                                            {gl.name}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                                            <span>{gl._count.sections} section{gl._count.sections !== 1 ? "s" : ""}</span>
                                            <span>•</span>
                                            <span>{gl._count.students} student{gl._count.students !== 1 ? "s" : ""}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            ))}

            {gradeLevels.length === 0 && (
                <div className="text-center py-16">
                    <School className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground)/0.3)] mb-3" />
                    <p className="text-[hsl(var(--muted-foreground))] font-medium">No grade levels found</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground)/0.7)] mt-1">Create grade levels first to start managing classes.</p>
                </div>
            )}
        </div>
    );
}
