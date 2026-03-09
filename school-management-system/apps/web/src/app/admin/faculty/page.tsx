"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Building2, Users, ChevronRight, Loader2, AlertCircle, Plus, Crown, LayoutDashboard } from "lucide-react";
import { CreateDepartmentModal } from "@/components/create-department-modal";
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
    const [showCreateModal, setShowCreateModal] = useState(false);
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
                        Faculty Overview
                    </button>

                    {selectedDepartmentId && (
                        <>
                            <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]/50 shrink-0 mx-1" />
                            <button
                                className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))] cursor-default"
                            >
                                <div className="px-3 py-1.5 rounded-lg border bg-[hsl(var(--background))] border-[hsl(var(--border))] shadow-sm">
                                    {selectedDepartmentName}
                                </div>
                            </button>
                        </>
                    )}
                </div>

                {/* Conditional Actions */}
                {currentView === "overview" && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md shadow-[hsl(var(--primary)/0.25)] shrink-0"
                    >
                        <Plus className="w-4 h-4" /> Create Department
                    </button>
                )}

                {currentView === "details" && selectedDepartmentId && (
                    <button
                        onClick={() => setShowAddFacultyModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md shadow-[hsl(var(--primary)/0.25)] shrink-0"
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
                            {/* Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-[hsl(var(--primary))]" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-[hsl(var(--foreground))] tracking-tight">{departments.length}</p>
                                            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Departments</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-[hsl(var(--foreground))] tracking-tight">{totalTeachers}</p>
                                            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Total Faculty Staff</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Department Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {departments.map((dept) => (
                                    <div
                                        key={dept.id}
                                        onClick={() => goToDetails(dept.id, dept.name)}
                                        className="group cursor-pointer bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))] box-shadow-sm hover:box-shadow-md hover:border-[hsl(var(--primary)/0.4)] hover:-translate-y-1 transition-all duration-300"
                                    >
                                        <div className="flex items-start justify-between mb-5">
                                            <div className="w-12 h-12 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                                                <Building2 className="w-6 h-6 text-[hsl(var(--primary))]" />
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center group-hover:bg-[hsl(var(--primary)/0.1)] transition-colors">
                                                <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </div>

                                        <h3 className="font-bold text-xl mb-3 text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                                            {dept.name}
                                        </h3>

                                        <div className="space-y-2 mt-4 text-sm text-[hsl(var(--muted-foreground))]">
                                            <div className="flex items-center justify-between bg-[hsl(var(--muted)/0.5)] px-3 py-2 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    <span className="font-medium">Faculty Limit</span>
                                                </div>
                                                <span className="font-bold text-[hsl(var(--foreground))]">{dept._count.teachers}</span>
                                            </div>

                                            <div className="px-1 text-xs mt-2">
                                                {dept.headTeacher ? (
                                                    <div className="flex items-center gap-2">
                                                        <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                                                        <span className="truncate"><span className="opacity-70">Head:</span> <span className="font-medium text-[hsl(var(--foreground))]">{dept.headTeacher.firstName} {dept.headTeacher.lastName}</span></span>
                                                    </div>
                                                ) : (
                                                    <p className="opacity-50 italic">No head assigned</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {departments.length === 0 && (
                                <div className="text-center py-20 bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] border-dashed shadow-sm">
                                    <div className="w-20 h-20 bg-[hsl(var(--primary)/0.05)] rounded-full flex items-center justify-center mx-auto mb-5">
                                        <Building2 className="w-10 h-10 text-[hsl(var(--muted-foreground)/0.5)]" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-[hsl(var(--foreground))]">No Departments Found</h3>
                                    <p className="text-[hsl(var(--muted-foreground))] font-medium max-w-md mx-auto">Create departments first to begin registering faculty members into the portal.</p>
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

            {/* Modals placed here to be accessible globally if needed */}
            <CreateDepartmentModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => { setShowCreateModal(false); fetchDepartments(); }}
            />
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
