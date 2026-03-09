"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, AlertCircle, BookOpen, Layers, LibraryBig } from "lucide-react";
import { SubjectManager } from "@/components/subjects/subject-manager";
import { cn } from "@/lib/utils";

interface GradeLevel {
    id: string;
    name: string;
    schoolLevel: string;
}

const SCHOOL_LEVELS = [
    { id: "KINDER", label: "Kindergarten", short: "Kinder", color: "bg-pink-500/10 text-pink-600 hover:bg-pink-500/20", activeColor: "bg-pink-500 text-white shadow-pink-500/25" },
    { id: "ELEM", label: "Elementary", short: "Elem", color: "bg-green-500/10 text-green-600 hover:bg-green-500/20", activeColor: "bg-green-500 text-white shadow-green-500/25" },
    { id: "JHS", label: "Junior High", short: "JHS", color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20", activeColor: "bg-blue-500 text-white shadow-blue-500/25" },
    { id: "SHS", label: "Senior High", short: "SHS", color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20", activeColor: "bg-purple-500 text-white shadow-purple-500/25" },
];

export default function SubjectsPage() {
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedSchoolLevel, setSelectedSchoolLevel] = useState<string>("JHS");
    const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        api.get("/grade-levels")
            .then((res) => {
                const grades = res.data.data;
                setGradeLevels(grades);
                // Pre-select first available school level if JHS is empty
                if (grades.length > 0 && !grades.some((g: GradeLevel) => g.schoolLevel === "JHS")) {
                    setSelectedSchoolLevel(grades[0].schoolLevel);
                }
            })
            .catch(() => setError("Failed to load curriculum layout"))
            .finally(() => setLoading(false));
    }, []);

    // When school level changes, try to auto-select the first grade level in that school level
    useEffect(() => {
        if (!gradeLevels.length) return;
        const gradesInLevel = gradeLevels.filter(g => g.schoolLevel === selectedSchoolLevel);
        if (gradesInLevel.length > 0) {
            setSelectedGradeId(gradesInLevel[0].id);
        } else {
            setSelectedGradeId(null);
        }
    }, [selectedSchoolLevel, gradeLevels]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
                <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--primary))]" />
                <p className="mt-4 text-[hsl(var(--muted-foreground))] font-medium">Loading curriculum layout...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)] gap-3 text-[hsl(var(--destructive))]">
                <AlertCircle className="w-6 h-6" />
                <p className="font-medium text-lg">{error}</p>
            </div>
        );
    }

    const currentGrades = gradeLevels.filter(g => g.schoolLevel === selectedSchoolLevel);

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header Area */}
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-[hsl(var(--primary)/0.05)] rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-[hsl(var(--foreground))]">
                        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center shadow-md shadow-[hsl(var(--primary)/0.25)] text-primary-foreground">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        Curriculum Subjects
                    </h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2 max-w-xl leading-relaxed">
                        Manage course offerings, configure subject hours, units, credits, and arrange prerequisites linearly across different school levels.
                    </p>
                </div>

                {/* Primary School Level Pills */}
                <div className="flex items-center gap-2 p-1.5 bg-[hsl(var(--muted)/0.5)] rounded-2xl border border-[hsl(var(--border)/0.5)] self-start md:self-auto relative z-10 w-full overflow-x-auto custom-scrollbar md:w-auto">
                    {SCHOOL_LEVELS.map((level) => {
                        const isActive = selectedSchoolLevel === level.id;
                        const hasGrades = gradeLevels.some(g => g.schoolLevel === level.id);

                        return (
                            <button
                                key={level.id}
                                onClick={() => hasGrades && setSelectedSchoolLevel(level.id)}
                                disabled={!hasGrades}
                                className={cn(
                                    "px-4 md:px-5 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap",
                                    isActive ? level.activeColor.concat(" shadow-md") : (hasGrades ? level.color : "opacity-40 cursor-not-allowed bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]")
                                )}
                            >
                                <span className="hidden md:inline">{level.label}</span>
                                <span className="md:hidden">{level.short}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            {currentGrades.length > 0 ? (
                <div className="space-y-6">
                    {/* Secondary Navigation (Grade Levels) */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar border-b border-[hsl(var(--border)/0.6)]">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--muted-foreground))] pr-4 border-r border-[hsl(var(--border))]">
                            <Layers className="w-4 h-4" /> Grade
                        </div>
                        <div className="flex gap-2 min-w-max pr-4">
                            {currentGrades.map((gl) => (
                                <button
                                    key={gl.id}
                                    onClick={() => setSelectedGradeId(gl.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        selectedGradeId === gl.id
                                            ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)] shadow-sm"
                                            : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] border border-transparent"
                                    )}
                                >
                                    {gl.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Data Table View */}
                    <div className="min-h-[500px]">
                        {selectedGradeId ? (
                            <SubjectManager key={selectedGradeId} gradeLevelId={selectedGradeId} />
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] border-dashed h-64">
                                <LibraryBig className="w-12 h-12 text-[hsl(var(--muted-foreground)/0.5)] mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Select a Grade Level</h3>
                                <p className="text-[hsl(var(--muted-foreground))]">Choose a grade level above to view and manage its specific curriculum.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-16 text-center bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm">
                    <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="w-10 h-10 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">No Grade Levels Configured</h3>
                    <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto leading-relaxed">
                        There are no grade levels set up for the "{SCHOOL_LEVELS.find(l => l.id === selectedSchoolLevel)?.label}" division yet. Please add grade levels first in the Academic Settings.
                    </p>
                </div>
            )}
        </div>
    );
}
