"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { School, Users, Loader2, AlertCircle, Plus, ChevronRight, LayoutDashboard } from "lucide-react";
import { CreateGradeLevelModal } from "@/components/create-grade-level-modal";
import { SectionList } from "@/components/classes/section-list";
import { SectionDetail } from "@/components/classes/section-detail";
import { motion, AnimatePresence } from "framer-motion";

interface GradeLevel {
    id: string;
    name: string;
    schoolLevel: string;
    _count: { sections: number; students: number };
}

const schoolLevelColors: Record<string, string> = {
    KINDER: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    ELEM: "bg-green-500/10 text-green-600 border-green-500/20",
    JHS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    SHS: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const schoolLevelLabels: Record<string, string> = {
    KINDER: "Kindergarten",
    ELEM: "Elementary",
    JHS: "Junior High School",
    SHS: "Senior High School",
};

type ViewState = "overview" | "sections" | "details";

export default function ClassesPage() {
    // Data state
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Navigation state
    const [currentView, setCurrentView] = useState<ViewState>("overview");
    const [slideDirection, setSlideDirection] = useState<"forward" | "backward">("forward");

    const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
    const [selectedGradeName, setSelectedGradeName] = useState<string | null>(null);

    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedSectionName, setSelectedSectionName] = useState<string | null>(null);

    const fetchGradeLevels = () => {
        setLoading(true);
        api.get("/grade-levels")
            .then((res) => setGradeLevels(res.data.data))
            .catch(() => setError("Failed to load grade levels"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchGradeLevels(); }, []);

    // Navigation Helpers
    const goToOverview = () => {
        setSlideDirection("backward");
        setCurrentView("overview");
        setSelectedGradeId(null);
        setSelectedGradeName(null);
        setSelectedSectionId(null);
        setSelectedSectionName(null);
    };

    const goToSections = (gradeId: string, gradeName: string) => {
        setSlideDirection(currentView === "overview" ? "forward" : "backward");
        setSelectedGradeId(gradeId);
        setSelectedGradeName(gradeName);
        setCurrentView("sections");
        setSelectedSectionId(null);
        setSelectedSectionName(null);
    };

    const goToDetails = (sectionId: string, sectionName: string) => {
        setSlideDirection("forward");
        setSelectedSectionId(sectionId);
        setSelectedSectionName(sectionName);
        setCurrentView("details");
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
                <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--primary))]" />
                <p className="mt-4 text-[hsl(var(--muted-foreground))] font-medium">Loading classes...</p>
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

    const grouped = gradeLevels.reduce<Record<string, GradeLevel[]>>((acc, gl) => {
        const level = gl.schoolLevel;
        if (!acc[level]) acc[level] = [];
        acc[level].push(gl);
        return acc;
    }, {});

    // Animation Variants
    const variants = {
        enter: (direction: "forward" | "backward") => ({
            x: direction === "forward" ? 40 : -40,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: "forward" | "backward") => ({
            zIndex: 0,
            x: direction === "forward" ? -40 : 40,
            opacity: 0,
        }),
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto min-h-[calc(100vh-8rem)] flex flex-col">

            {/* Persistent Dynamic Breadcrumb Header */}
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-4 md:px-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-4 z-20">
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0 whitespace-nowrap mask-linear-fade">
                    <button
                        onClick={goToOverview}
                        className={`flex items-center gap-2 text-sm font-semibold transition-colors ${currentView === 'overview' ? 'text-[hsl(var(--foreground))] cursor-default' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentView === 'overview' ? 'bg-[hsl(var(--primary))] text-primary-foreground shadow-sm' : 'bg-[hsl(var(--muted))]'}`}>
                            <LayoutDashboard className="w-4 h-4" />
                        </div>
                        Classes Overview
                    </button>

                    {selectedGradeId && (
                        <>
                            <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]/50 shrink-0 mx-1" />
                            <button
                                onClick={() => goToSections(selectedGradeId, selectedGradeName!)}
                                className={`flex items-center gap-2 text-sm font-semibold transition-colors ${currentView === 'sections' ? 'text-[hsl(var(--foreground))] cursor-default' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
                            >
                                <div className={`px-3 py-1.5 rounded-lg border ${currentView === 'sections' ? 'bg-[hsl(var(--background))] border-[hsl(var(--border))] shadow-sm' : 'border-transparent'}`}>
                                    {selectedGradeName}
                                </div>
                            </button>
                        </>
                    )}

                    {selectedSectionId && (
                        <>
                            <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]/50 shrink-0 mx-1" />
                            <button
                                className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))] cursor-default"
                            >
                                <div className="px-3 py-1.5 rounded-lg border bg-[hsl(var(--background))] border-[hsl(var(--border))] shadow-sm">
                                    {selectedSectionName}
                                </div>
                            </button>
                        </>
                    )}
                </div>

                {/* Only show Create GRade Level globally on Overview */}
                {currentView === "overview" && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md shadow-[hsl(var(--primary)/0.25)] shrink-0"
                    >
                        <Plus className="w-4 h-4" /> Create Grade Level
                    </button>
                )}
            </div>

            {/* Dynamic Content Area */}
            <div className="relative flex-1">
                <AnimatePresence mode="wait" custom={slideDirection}>
                    {currentView === "overview" && (
                        <motion.div
                            key="overview"
                            custom={slideDirection}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="space-y-8"
                        >
                            {/* Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                                            <School className="w-6 h-6 text-[hsl(var(--primary))]" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-[hsl(var(--foreground))] tracking-tight">{gradeLevels.length}</p>
                                            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Grade Levels</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
                                            <School className="w-6 h-6 text-teal-600" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-[hsl(var(--foreground))] tracking-tight">
                                                {gradeLevels.reduce((a, g) => a + g._count.sections, 0)}
                                            </p>
                                            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Total Sections</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-[hsl(var(--foreground))] tracking-tight">
                                                {gradeLevels.reduce((a, g) => a + g._count.students, 0)}
                                            </p>
                                            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Total Students</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Grade Level Cards grouped by School Level */}
                            {Object.entries(grouped).map(([level, grades]) => (
                                <div key={level} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${schoolLevelColors[level] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                                            {schoolLevelLabels[level] || level}
                                        </span>
                                        <div className="h-px flex-1 bg-[hsl(var(--border))]"></div>
                                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                                            {grades.length} grade level{grades.length !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {grades.map((gl) => (
                                            <div
                                                key={gl.id}
                                                onClick={() => goToSections(gl.id, gl.name)}
                                                className="group cursor-pointer bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] box-shadow-sm hover:box-shadow-md hover:border-[hsl(var(--primary)/0.4)] hover:-translate-y-1 transition-all duration-300"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="font-bold text-lg text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                                                        {gl.name}
                                                    </h3>
                                                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center group-hover:bg-[hsl(var(--primary)/0.1)] transition-colors">
                                                        <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] group-hover:translate-x-0.5 transition-all" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] font-medium bg-[hsl(var(--muted)/0.5)] px-3 py-2 rounded-lg">
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <School className="w-4 h-4" /> {gl._count.sections}
                                                    </div>
                                                    <div className="w-px h-4 bg-[hsl(var(--border))]"></div>
                                                    <div className="flex-1 flex justify-end items-center gap-2">
                                                        <Users className="w-4 h-4" /> {gl._count.students}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {gradeLevels.length === 0 && (
                                <div className="text-center py-20 bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] border-dashed shadow-sm">
                                    <div className="w-20 h-20 bg-[hsl(var(--primary)/0.05)] rounded-full flex items-center justify-center mx-auto mb-5">
                                        <LayoutDashboard className="w-10 h-10 text-[hsl(var(--muted-foreground)/0.5)]" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-[hsl(var(--foreground))]">No Grade Levels Found</h3>
                                    <p className="text-[hsl(var(--muted-foreground))] font-medium max-w-md mx-auto">Create grade levels first to start managing your school's classes and sections.</p>
                                </div>
                            )}

                        </motion.div>
                    )}

                    {currentView === "sections" && selectedGradeId && (
                        <motion.div
                            key="sections"
                            custom={slideDirection}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <SectionList
                                gradeId={selectedGradeId}
                                onSelectSection={goToDetails}
                            />
                        </motion.div>
                    )}

                    {currentView === "details" && selectedSectionId && selectedGradeId && (
                        <motion.div
                            key="details"
                            custom={slideDirection}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <SectionDetail
                                sectionId={selectedSectionId}
                                gradeId={selectedGradeId}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Create Grade Level Modal */}
            <CreateGradeLevelModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => { setShowCreateModal(false); fetchGradeLevels(); }}
            />
        </div>
    );
}
