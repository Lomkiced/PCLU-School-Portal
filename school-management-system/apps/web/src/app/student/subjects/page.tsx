"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, MapPin, Loader2, AlertCircle, Building2, User, Hash, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SubjectDept {
    name: string;
}

interface EnrolledSubject {
    id: string;
    code: string;
    name: string;
    units: number;
    credits: number;
    lectureHours: number;
    labHours: number;
    department?: SubjectDept | null;
}

interface Section {
    name: string;
    room?: { name: string };
}

interface AcademicYear {
    name: string;
}

interface SubjectEnrollment {
    id: string;
    status: string;
    finalGrade: number | null;
    subject: EnrolledSubject;
    section: Section;
    academicYear: AcademicYear;
}

export default function StudentSubjectsPage() {
    const { accessToken } = useAuthStore();
    const [enrollments, setEnrollments] = useState<SubjectEnrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!accessToken) return;

        const fetchSubjects = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/enrollments/my-enrollments`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!res.ok) throw new Error("Failed to fetch enrolled subjects");

                const json = await res.json();
                if (json.success) {
                    setEnrollments(json.data);
                } else {
                    throw new Error(json.message || "Failed to load subjects");
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, [accessToken]);

    const getSubjectColor = (code: string) => {
        const colors = [
            "bg-blue-500/10 text-blue-500 border-blue-500/20",
            "bg-purple-500/10 text-purple-500 border-purple-500/20",
            "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            "bg-amber-500/10 text-amber-500 border-amber-500/20",
            "bg-pink-500/10 text-pink-500 border-pink-500/20",
            "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
            "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        ];
        let hash = 0;
        for (let i = 0; i < code.length; i++) {
            hash = code.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } },
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--primary))]" />
                <p className="text-[hsl(var(--muted-foreground))] font-medium animate-pulse">Loading your subjects...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4 text-[hsl(var(--destructive))]">
                <AlertCircle className="w-12 h-12" />
                <p className="font-semibold text-lg">Error loading subjects</p>
                <p className="text-sm opacity-80">{error}</p>
            </div>
        );
    }

    // Default stats based on currently fetched enrollments
    const totalUnits = enrollments.reduce((sum, e) => sum + e.subject.units, 0);
    const activeTerm = enrollments[0]?.academicYear?.name || "N/A";

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header section with modern glass effect */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] p-8 md:p-10 text-white shadow-xl card-shadow-lg group">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl z-0 pointer-events-none transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-black/10 rounded-full blur-2xl z-0 pointer-events-none transition-transform duration-700 group-hover:translate-x-10" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-sm font-semibold shadow-sm">
                            <BookOpen className="w-4 h-4" /> Active Semester: {activeTerm}
                        </div>
                        <motion.h1
                            initial={{ opacity: 0, x: -25 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2"
                        >
                            My Subjects
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, x: -25 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-white/80 font-medium text-lg max-w-xl"
                        >
                            Overview of your current courses, units, and class details.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-4 bg-black/20 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-inner"
                    >
                        <div className="text-center px-4 border-r border-white/10">
                            <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">Total Enrolled</p>
                            <p className="text-3xl font-bold">{enrollments.length}</p>
                        </div>
                        <div className="text-center px-4">
                            <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">Total Units</p>
                            <p className="text-3xl font-bold">{totalUnits}</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Grid of Enrolled Subjects */}
            {enrollments.length === 0 ? (
                <div className="bg-[hsl(var(--card))] rounded-3xl p-12 card-shadow border border-[hsl(var(--border))] text-center">
                    <div className="w-20 h-20 rounded-full bg-[hsl(var(--muted))] mx-auto flex items-center justify-center mb-6">
                        <BookOpen className="w-10 h-10 text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">No Subjects Enrolled</h3>
                    <p className="text-[hsl(var(--muted-foreground))] text-lg max-w-md mx-auto">
                        You do not have any active subject enrollments for the current academic year.
                    </p>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                    <AnimatePresence>
                        {enrollments.map((enrollment) => {
                            const subject = enrollment.subject;
                            const colorClasses = getSubjectColor(subject.code);

                            // Determine status color
                            const statusColor =
                                enrollment.status === "PASSED" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                    enrollment.status === "FAILED" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                                        enrollment.status === "DROPPED" ? "bg-gray-500/10 text-gray-600 border-gray-500/20" :
                                            "bg-blue-500/10 text-blue-600 border-blue-500/20"; // IN_PROGRESS

                            return (
                                <motion.div
                                    key={enrollment.id}
                                    variants={itemVariants}
                                    className={cn(
                                        "group relative flex flex-col overflow-hidden rounded-3xl border bg-[hsl(var(--card))] transition-all duration-300",
                                        "hover:shadow-xl hover:-translate-y-1.5",
                                        "backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70"
                                    )}
                                >
                                    {/* Top decorative visual matching subject code color */}
                                    <div className={cn("h-3 w-full", colorClasses.split(' ')[0].replace('/10', '/80'))} />

                                    {/* Main Card Content */}
                                    <div className="flex flex-col flex-1 p-6 relative">
                                        <div className={cn(
                                            "absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-10 -z-10 -mt-10 -mr-10 transition-transform duration-700 group-hover:scale-150",
                                            colorClasses.split(' ')[0].replace('/10', '/40')
                                        )} />

                                        {/* Badges row */}
                                        <div className="flex items-center justify-between gap-2 mb-4">
                                            <Badge variant="outline" className={cn("font-bold px-3 py-1 text-sm border-2 rounded-xl", colorClasses)}>
                                                {subject.code}
                                            </Badge>
                                            <Badge variant="outline" className={cn("font-semibold rounded-lg uppercase tracking-wider text-xs px-2.5 py-0.5", statusColor)}>
                                                {enrollment.status.replace("_", " ")}
                                            </Badge>
                                        </div>

                                        {/* Subject Title */}
                                        <h3 className="line-clamp-2 text-xl font-extrabold text-[hsl(var(--foreground))] mb-4 leading-tight">
                                            {subject.name}
                                        </h3>

                                        {/* Status Layout Grid */}
                                        <div className="grid grid-cols-2 gap-3 mb-6 flex-1 content-start">
                                            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))]">
                                                <div className="p-1.5 bg-background rounded-lg shadow-sm border">
                                                    <Hash className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none mb-1">Section</p>
                                                    <p className="text-sm font-semibold truncate leading-none">{enrollment.section.name}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))]">
                                                <div className="p-1.5 bg-background rounded-lg shadow-sm border">
                                                    <Clock className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none mb-1">Units</p>
                                                    <p className="text-sm font-semibold truncate leading-none">{subject.units} ({subject.lectureHours}L/{subject.labHours}Lab)</p>
                                                </div>
                                            </div>

                                            {subject.department && (
                                                <div className="col-span-2 flex items-center gap-2.5 p-2.5 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))]">
                                                    <div className="p-1.5 bg-background rounded-lg shadow-sm border">
                                                        <Building2 className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none mb-1">Department</p>
                                                        <p className="text-sm font-semibold truncate leading-none">{subject.department.name}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer indicating final grade if any */}
                                        {enrollment.finalGrade !== null ? (
                                            <div className="mt-auto flex items-center justify-between border-t border-[hsl(var(--border))] pt-4">
                                                <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Final Grade</span>
                                                <span className="text-lg font-bold px-3 py-1 bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] rounded-lg">
                                                    {enrollment.finalGrade.toFixed(2)}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="mt-auto border-t border-[hsl(var(--border))] pt-4 flex items-center text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer group/link">
                                                <span>View Subject Details</span>
                                                <svg className="w-4 h-4 ml-2 transition-transform group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
