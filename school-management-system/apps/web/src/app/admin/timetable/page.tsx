"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, AlertCircle, School, Users, CalendarDays, LayoutTemplate } from "lucide-react";
import { ScheduleBuilder } from "@/components/timetable/schedule-builder";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface Section {
    id: string;
    name: string;
    capacity: number;
    gradeLevelId: string;
    _count: { students: number };
}

interface GradeLevel {
    id: string;
    name: string;
    schoolLevel: string;
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

export default function TimetableManagementPage() {
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get("/grade-levels"),
            api.get("/sections")
        ])
            .then(([glRes, secRes]) => {
                setGradeLevels(glRes.data.data);
                setSections(secRes.data.data);
            })
            .catch(() => setError("Failed to load timetable data"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--primary))]" />
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

    // Group grade levels by school level for the accordion
    const groupedGrades = gradeLevels.reduce<Record<string, GradeLevel[]>>((acc, gl) => {
        const level = gl.schoolLevel;
        if (!acc[level]) acc[level] = [];
        acc[level].push(gl);
        return acc;
    }, {});

    const getSectionsForGrade = (gradeId: string) => {
        return sections.filter(sec => sec.gradeLevelId === gradeId);
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col sm:flex-row gap-6">
            {/* Sidebar */}
            <div className="w-full sm:w-80 flex-shrink-0 flex flex-col bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-sm overflow-hidden h-full">
                <div className="p-5 border-b border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--muted))/0.5]">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <LayoutTemplate className="w-5 h-5 text-[hsl(var(--primary))]" />
                        Sections Structure
                    </h2>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        Select a section to manage schedules
                    </p>
                </div>

                <ScrollArea className="flex-1 p-3">
                    <Accordion type="multiple" className="w-full space-y-3" defaultValue={Object.keys(groupedGrades)}>
                        {Object.entries(groupedGrades).map(([level, grades]) => (
                            <AccordionItem value={level} key={level} className="border-none">
                                <AccordionTrigger className="hover:no-underline py-2 px-3 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors group">
                                    <div className="flex items-center gap-2 text-left">
                                        <div className={cn("w-2 h-2 rounded-full", schoolLevelColors[level]?.split(' ')[0] || "bg-gray-500/10")} />
                                        <span className="font-semibold text-sm group-hover:text-[hsl(var(--primary))] transition-colors">
                                            {schoolLevelLabels[level] || level}
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-1 pb-2 px-2">
                                    <div className="space-y-4 mt-2">
                                        {grades.map((gl) => {
                                            const gradeSections = getSectionsForGrade(gl.id);
                                            return (
                                                <div key={gl.id} className="space-y-1.5 pl-4 border-l-2 border-[hsl(var(--border))] ml-2">
                                                    <h4 className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider pl-2 flex items-center gap-2">
                                                        <School className="w-3.5 h-3.5" />
                                                        {gl.name}
                                                    </h4>
                                                    <div className="space-y-1 mt-1">
                                                        {gradeSections.length > 0 ? (
                                                            gradeSections.map((section) => (
                                                                <button
                                                                    key={section.id}
                                                                    onClick={() => setSelectedSectionId(section.id)}
                                                                    className={cn(
                                                                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group",
                                                                        selectedSectionId === section.id
                                                                            ? "bg-[hsl(var(--primary))] text-primary-foreground shadow-md font-medium"
                                                                            : "hover:bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]"
                                                                    )}
                                                                >
                                                                    <span className="truncate">{section.name}</span>
                                                                    {selectedSectionId === section.id && (
                                                                        <CalendarDays className="w-4 h-4 opacity-80 shrink-0" />
                                                                    )}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-[hsl(var(--muted-foreground))] italic pl-3 pb-1">No sections</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </ScrollArea>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-w-0">
                {selectedSectionId ? (
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                        <ScheduleBuilder sectionId={selectedSectionId} />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[hsl(var(--primary)/0.05)] to-transparent">
                        <div className="w-20 h-20 rounded-2xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center mb-6 shadow-inner">
                            <CalendarDays className="w-10 h-10 text-[hsl(var(--primary))]" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Select a Section</h3>
                        <p className="text-[hsl(var(--muted-foreground))] max-w-[400px] leading-relaxed">
                            Choose a section from the sidebar to view, manage, and arrange its weekly class schedule.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
