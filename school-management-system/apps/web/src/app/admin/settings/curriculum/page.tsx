"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { School, Users, Loader2, AlertCircle, Plus, ChevronRight, BookOpen } from "lucide-react";
import { CreateGradeLevelModal } from "@/components/create-grade-level-modal";
import { CreateSectionModal } from "@/components/create-section-modal";
import { motion, AnimatePresence } from "framer-motion";
import BreadcrumbNav, { BreadcrumbItem } from "@/components/BreadcrumbNav";

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

type ViewState = "overview" | "sections";

export default function CurriculumSettingsPage() {
    // Data state
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateGradeModal, setShowCreateGradeModal] = useState(false);
    const [showCreateSectionModal, setShowCreateSectionModal] = useState(false);

    // Navigation state
    const [currentView, setCurrentView] = useState<ViewState>("overview");
    const [slideDirection, setSlideDirection] = useState<"forward" | "backward">("forward");

    const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
    const [selectedGradeName, setSelectedGradeName] = useState<string | null>(null);
    const [selectedGradeData, setSelectedGradeData] = useState<GradeLevel | null>(null);

    const fetchGradeLevels = () => {
        setLoading(true);
        api.get("/grade-levels")
            .then((res) => {
                setGradeLevels(res.data.data);
                // If we are in sections view, refresh the specific grade data
                if (selectedGradeId) {
                    api.get(`/grade-levels/${selectedGradeId}`)
                        .then((resGrade) => setSelectedGradeData(resGrade.data.data))
                        .catch(console.error);
                }
            })
            .catch(() => setError("Failed to load generic curriculum data"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchGradeLevels(); }, []);

    // Navigation Helpers
    const goToOverview = () => {
        setSlideDirection("backward");
        setCurrentView("overview");
        setSelectedGradeId(null);
        setSelectedGradeName(null);
        setSelectedGradeData(null);
    };

    const goToSections = (gradeId: string, gradeName: string) => {
        setSlideDirection(currentView === "overview" ? "forward" : "backward");
        setSelectedGradeId(gradeId);
        setSelectedGradeName(gradeName);
        setCurrentView("sections");

        // Fetch full grade level data including sections
        api.get(`/grade-levels/${gradeId}`)
            .then((res) => setSelectedGradeData(res.data.data))
            .catch(console.error);
    };

    if (loading && gradeLevels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground font-medium">Loading curriculum structure...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)] gap-3 text-destructive">
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

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Settings", href: "/admin/settings" },
        { label: "Curriculum Setup", onClick: goToOverview }
    ];

    if (currentView === "sections" && selectedGradeName) {
        breadcrumbItems.push({ label: selectedGradeName, onClick: () => { } });
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto min-h-[calc(100vh-8rem)] flex flex-col">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <BreadcrumbNav items={breadcrumbItems} />

                {/* Conditional Actions */}
                {currentView === "overview" && (
                    <button
                        onClick={() => setShowCreateGradeModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/25 shrink-0"
                    >
                        <Plus className="w-4 h-4" /> Create Grade Level
                    </button>
                )}

                {currentView === "sections" && selectedGradeId && (
                    <button
                        onClick={() => setShowCreateSectionModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-all shadow-md shadow-teal-600/25 shrink-0"
                    >
                        <Plus className="w-4 h-4" /> Create Section
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
                            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-emerald-600" />
                                    Curriculum Setup
                                </h2>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Configure the structural grade levels for your school. Click on a specific grade level to manage its standard sections.
                                </p>
                            </div>

                            {/* Grade Level Cards grouped by School Level */}
                            {Object.entries(grouped).map(([level, grades]) => (
                                <div key={level} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${schoolLevelColors[level] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                                            {schoolLevelLabels[level] || level}
                                        </span>
                                        <div className="h-px flex-1 bg-border"></div>
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {grades.length} grade level{grades.length !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {grades.map((gl) => (
                                            <div
                                                key={gl.id}
                                                onClick={() => goToSections(gl.id, gl.name)}
                                                className="group cursor-pointer bg-card rounded-2xl p-5 border border-border box-shadow-sm hover:box-shadow-md hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="font-bold text-lg text-foreground group-hover:text-emerald-600 transition-colors">
                                                        {gl.name}
                                                    </h3>
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-muted/50 px-3 py-2 rounded-lg">
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4" /> {gl._count.sections} Sections
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {gradeLevels.length === 0 && (
                                <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed shadow-sm">
                                    <div className="w-20 h-20 bg-emerald-500/5 rounded-full flex items-center justify-center mx-auto mb-5">
                                        <BookOpen className="w-10 h-10 text-emerald-600/50" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-foreground">No Grade Levels Configured</h3>
                                    <p className="text-muted-foreground font-medium max-w-md mx-auto">Create grade levels to set up your school's structural curriculum.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {currentView === "sections" && selectedGradeData && (
                        <motion.div
                            key="sections"
                            custom={slideDirection}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="space-y-6"
                        >
                            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                                <h2 className="text-xl font-bold text-foreground">{selectedGradeData.name} Sections Configuration</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Configure default sections with set capacities for this grade level.
                                </p>
                            </div>

                            {/* Sections Grid */}
                            {selectedGradeData.sections && selectedGradeData.sections.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {selectedGradeData.sections.map((section) => (
                                        <div
                                            key={section.id}
                                            className="group bg-card rounded-2xl p-5 border border-border box-shadow-sm hover:box-shadow-md hover:border-emerald-500/30 transition-all duration-300"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                    <School className="w-5 h-5 text-emerald-600" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-lg mb-1 group-hover:text-emerald-600 transition-colors">
                                                {selectedGradeData.name} — {section.name}
                                            </h3>
                                            <div className="space-y-2 mt-3 text-sm text-muted-foreground">
                                                <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4" />
                                                        <span className="font-medium">Capacity</span>
                                                    </div>
                                                    <span className="font-bold text-foreground">{section.capacity} Max</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-card rounded-2xl border border-border shadow-sm">
                                    <div className="w-16 h-16 bg-emerald-500/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <School className="w-8 h-8 text-emerald-600/50" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2 text-foreground">No sections configured</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto">Create standard sections for this grade level to govern class capacities.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals integrated natively */}
            <CreateGradeLevelModal
                open={showCreateGradeModal}
                onClose={() => setShowCreateGradeModal(false)}
                onSuccess={() => { setShowCreateGradeModal(false); fetchGradeLevels(); }}
            />
            {currentView === "sections" && selectedGradeId && selectedGradeData && (
                <CreateSectionModal
                    open={showCreateSectionModal}
                    gradeId={selectedGradeId}
                    gradeName={selectedGradeData.name}
                    onClose={() => setShowCreateSectionModal(false)}
                    onSuccess={() => { setShowCreateSectionModal(false); fetchGradeLevels(); }}
                />
            )}
        </div>
    );
}
