"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Building2, Users, ChevronRight, Loader2, AlertCircle, Plus, Crown, LayoutDashboard, Settings } from "lucide-react";
import { AddFacultyModal } from "@/components/add-faculty-modal";
import { DepartmentDetail } from "@/components/faculty/department-detail";
import { motion, AnimatePresence } from "framer-motion";

interface Department {
    id: string;
    name: string;
    headTeacher: { firstName: string; lastName: string } | null;
    _count: { teachers: number };
}

type ViewState = "overview" | "details";

export default function FacultyPage() {
    // Data state
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal state
    const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);

    // Navigation state
    const [currentView, setCurrentView] = useState<ViewState>("overview");
    const [slideDirection, setSlideDirection] = useState<"forward" | "backward">("forward");

    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
    const [selectedDepartmentName, setSelectedDepartmentName] = useState<string | null>(null);

    const fetchDepartments = () => {
        setLoading(true);
        api.get("/departments")
            .then((res) => setDepartments(res.data.data))
            .catch(() => setError("Failed to load departments"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDepartments(); }, []);

    // Navigation Helpers
    const goToOverview = () => {
        setSlideDirection("backward");
        setCurrentView("overview");
        setSelectedDepartmentId(null);
        setSelectedDepartmentName(null);
    };

    const goToDetails = (departmentId: string, departmentName: string) => {
        setSlideDirection("forward");
        setSelectedDepartmentId(departmentId);
        setSelectedDepartmentName(departmentName);
        setCurrentView("details");
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
                <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--primary))]" />
                <p className="mt-4 text-[hsl(var(--muted-foreground))] font-medium">Loading faculty...</p>
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

    const totalTeachers = departments.reduce((sum, d) => sum + d._count.teachers, 0);

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
                        Faculty Overview
                    </button>

                    {selectedDepartmentId && (
                        <>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mx-0.5" />
                            <button
                                className={`group relative flex items-center gap-2 text-sm font-semibold transition-all duration-300 px-4 py-2 rounded-full text-primary`}
                            >
                                <motion.div layoutId="nav-bg" className="absolute inset-0 bg-primary/10 rounded-full -z-10" />
                                {selectedDepartmentName}
                            </button>
                        </>
                    )}
                </div>

                {/* Conditional Actions */}
                {currentView === "details" && selectedDepartmentId && (
                    <button
                        onClick={() => setShowAddFacultyModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:-translate-y-0.5 transition-all duration-300"
                    >
                        <Plus className="w-4 h-4" /> Add Faculty
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
                            {/* Premium Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="relative group overflow-hidden bg-card/50 backdrop-blur-sm rounded-[2rem] p-6 border border-border/50 shadow-sm transition-all duration-500 hover:shadow-md hover:-translate-y-1 hover:border-primary/30">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-1 tracking-wide uppercase text-[10px]">Total Departments</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-4xl font-black text-foreground tracking-tighter">{departments.length}</p>
                                            </div>
                                        </div>
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                                            <Building2 className="w-7 h-7 text-primary" />
                                        </div>
                                    </div>
                                </div>
                                <div className="relative group overflow-hidden bg-card/50 backdrop-blur-sm rounded-[2rem] p-6 border border-border/50 shadow-sm transition-all duration-500 hover:shadow-md hover:-translate-y-1 hover:border-indigo-500/30">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-1 tracking-wide uppercase text-[10px]">Total Faculty Staff</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-4xl font-black text-foreground tracking-tighter">{totalTeachers}</p>
                                            </div>
                                        </div>
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 flex items-center justify-center border border-indigo-500/10 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                                            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Premium Department Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                                {departments.map((dept, index) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        key={dept.id}
                                        onClick={() => goToDetails(dept.id, dept.name)}
                                        className="group relative cursor-pointer bg-card rounded-[1.5rem] p-1 border border-border/50 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1.5rem]" />

                                        <div className="bg-background/50 backdrop-blur-sm rounded-[1.25rem] p-6 h-full border border-transparent group-hover:border-primary/10 transition-colors flex flex-col">
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="w-12 h-12 rounded-[1rem] bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                    <Building2 className="w-6 h-6 text-primary" />
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center group-hover:bg-primary group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)] transition-all duration-300">
                                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                            </div>

                                            <h3 className="font-extrabold text-xl text-foreground group-hover:text-primary transition-colors tracking-tight mb-4 pr-4">
                                                {dept.name}
                                            </h3>

                                            <div className="mt-auto space-y-4 pt-4 border-t border-border/50">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                                                        <Users className="w-4 h-4 text-primary/70" />
                                                        <span>Faculty Limit</span>
                                                    </div>
                                                    <span className="font-black text-foreground bg-muted/50 px-2.5 py-0.5 rounded-md">{dept._count.teachers}</span>
                                                </div>

                                                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${dept.headTeacher ? 'bg-amber-500/10' : 'bg-muted'}`}>
                                                        <Crown className={`w-4 h-4 ${dept.headTeacher ? 'text-amber-500' : 'text-muted-foreground/40'}`} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-bold tracking-widest uppercase mb-0.5 text-muted-foreground/70">Department Head</p>
                                                        {dept.headTeacher ? (
                                                            <p className="font-bold text-foreground truncate">{dept.headTeacher.firstName} {dept.headTeacher.lastName}</p>
                                                        ) : (
                                                            <p className="italic opacity-50">Unassigned</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {departments.length === 0 && (
                                <div className="text-center py-20 bg-card/60 rounded-[2rem] border border-border/50 border-dashed shadow-sm">
                                    <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-5">
                                        <Building2 className="w-10 h-10 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-foreground">No Departments Configured</h3>
                                    <p className="text-muted-foreground font-medium max-w-md mx-auto mb-6">Base departments have not been set up yet. Please configure your academic structure in settings.</p>
                                    <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors text-sm font-semibold">
                                        <Settings className="w-4 h-4" />
                                        Go to Settings
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {currentView === "details" && selectedDepartmentId && (
                        <motion.div
                            key="details"
                            custom={slideDirection}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <DepartmentDetail departmentId={selectedDepartmentId} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Global Modals */}
            {currentView === "details" && selectedDepartmentId && (
                <AddFacultyModal
                    open={showAddFacultyModal}
                    departmentId={selectedDepartmentId}
                    departmentName={selectedDepartmentName || ""}
                    onClose={() => setShowAddFacultyModal(false)}
                    // Instead of full fetch we only need to reload DepartmentDetail, 
                    // but practically the user might need to reload the page or we could rely on internal reloads.
                    onSuccess={() => { setShowAddFacultyModal(false); window.location.reload(); }}
                />
            )}
        </div>
    );
}
