"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { School, Users, Loader2, AlertCircle, ChevronRight, LayoutDashboard, Settings } from "lucide-react";
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
        <div className="space-y-8 max-w-[1600px] mx-auto min-h-[calc(100vh-8rem)] flex flex-col relative px-4 md:px-8 pb-12">

            {/* Premium Floating Navigation */}
            <div className="bg-background/60 backdrop-blur-xl border border-border/50 rounded-full px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-6 z-30 mb-4 w-full max-w-4xl mx-auto transition-all duration-500 hover:bg-background/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0 whitespace-nowrap mask-linear-fade">
                    <button
                        onClick={goToOverview}
                        className={`group relative flex items-center gap-2.5 text-sm font-semibold transition-all duration-300 px-4 py-2 rounded-full ${currentView === 'overview' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {currentView === 'overview' && (
                            <motion.div layoutId="nav-bg" className="absolute inset-0 bg-primary/10 rounded-full -z-10" />
                        )}
                        <LayoutDashboard className={`w-4 h-4 transition-transform duration-300 ${currentView === 'overview' ? 'scale-110' : 'group-hover:scale-110'}`} />
                        Overview
                    </button>

                    {selectedGradeId && (
                        <>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mx-0.5" />
                            <button
                                onClick={() => goToSections(selectedGradeId, selectedGradeName!)}
                                className={`group relative flex items-center gap-2 text-sm font-semibold transition-all duration-300 px-4 py-2 rounded-full ${currentView === 'sections' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {currentView === 'sections' && (
                                    <motion.div layoutId="nav-bg" className="absolute inset-0 bg-primary/10 rounded-full -z-10" />
                                )}
                                {selectedGradeName}
                            </button>
                        </>
                    )}

                    {selectedSectionId && (
                        <>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mx-0.5" />
                            <button
                                className={`group relative flex items-center gap-2 text-sm font-semibold transition-all duration-300 px-4 py-2 rounded-full text-primary`}
                            >
                                <motion.div layoutId="nav-bg" className="absolute inset-0 bg-primary/10 rounded-full -z-10" />
                                {selectedSectionName}
                            </button>
                        </>
                    )}
                </div>

                {/* Optional Right Action Area in Nav (Reserved) */}
                <div className="hidden sm:flex items-center">

                </div>
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
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="relative group overflow-hidden bg-card/50 backdrop-blur-sm rounded-[2rem] p-6 border border-border/50 shadow-sm transition-all duration-500 hover:shadow-md hover:-translate-y-1 hover:border-primary/30">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-1 tracking-wide uppercase text-[10px]">Total Grades</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-4xl font-black text-foreground tracking-tighter">{gradeLevels.length}</p>
                                            </div>
                                        </div>
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                                            <School className="w-7 h-7 text-primary" />
                                        </div>
                                    </div>
                                </div>

                                <div className="relative group overflow-hidden bg-card/50 backdrop-blur-sm rounded-[2rem] p-6 border border-border/50 shadow-sm transition-all duration-500 hover:shadow-md hover:-translate-y-1 hover:border-teal-500/30">
                                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-1 tracking-wide uppercase text-[10px]">Active Sections</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-4xl font-black text-foreground tracking-tighter">
                                                    {gradeLevels.reduce((a, g) => a + g._count.sections, 0)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-500/5 flex items-center justify-center border border-teal-500/10 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                            <LayoutDashboard className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="relative group overflow-hidden bg-card/50 backdrop-blur-sm rounded-[2rem] p-6 border border-border/50 shadow-sm transition-all duration-500 hover:shadow-md hover:-translate-y-1 hover:border-indigo-500/30">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-1 tracking-wide uppercase text-[10px]">Total Students</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-4xl font-black text-foreground tracking-tighter">
                                                    {gradeLevels.reduce((a, g) => a + g._count.students, 0)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 flex items-center justify-center border border-indigo-500/10 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                                            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Grade Level Grid */}
                            <div className="space-y-12 mt-8">
                                {Object.entries(grouped).map(([level, grades], index) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        key={level}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border ${schoolLevelColors[level] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                                                {schoolLevelLabels[level] || level}
                                            </div>
                                            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent"></div>
                                            <span className="text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1 rounded-full backdrop-blur-sm">
                                                {grades.length} Grade{grades.length !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {grades.map((gl) => (
                                                <div
                                                    key={gl.id}
                                                    onClick={() => goToSections(gl.id, gl.name)}
                                                    className="group relative cursor-pointer bg-card rounded-[1.5rem] p-1 border border-border/50 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1.5rem]" />

                                                    <div className="bg-background/50 backdrop-blur-sm rounded-[1.25rem] p-5 h-full border border-transparent group-hover:border-primary/10 transition-colors">
                                                        <div className="flex items-start justify-between mb-6">
                                                            <h3 className="font-extrabold text-xl text-foreground group-hover:text-primary transition-colors tracking-tight">
                                                                {gl.name}
                                                            </h3>
                                                            <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center group-hover:bg-primary group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)] transition-all duration-300">
                                                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 bg-muted/40 group-hover:bg-primary/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-colors">
                                                                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground group-hover:text-primary/70 mb-1">
                                                                    <School className="w-3.5 h-3.5" /> Sections
                                                                </div>
                                                                <span className="text-lg font-bold text-foreground group-hover:text-primary">{gl._count.sections}</span>
                                                            </div>
                                                            <div className="w-px h-10 bg-border/60"></div>
                                                            <div className="flex-1 bg-muted/40 group-hover:bg-primary/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-colors">
                                                                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground group-hover:text-primary/70 mb-1">
                                                                    <Users className="w-3.5 h-3.5" /> Students
                                                                </div>
                                                                <span className="text-lg font-bold text-foreground group-hover:text-primary">{gl._count.students}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {gradeLevels.length === 0 && (
                                <div className="text-center py-20 bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] border-dashed shadow-sm">
                                    <div className="w-20 h-20 bg-[hsl(var(--primary)/0.05)] rounded-full flex items-center justify-center mx-auto mb-5">
                                        <LayoutDashboard className="w-10 h-10 text-[hsl(var(--muted-foreground)/0.5)]" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-[hsl(var(--foreground))]">No Grade Levels Configured</h3>
                                    <p className="text-[hsl(var(--muted-foreground))] font-medium max-w-md mx-auto">Grade levels have not been set up yet. Please configure your academic structure in the settings.</p>
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
        </div>
    );
}
