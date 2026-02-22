"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import {
    GraduationCap, UserPlus, Users, ChevronRight,
    Loader2, AlertCircle, UserCheck, UserX,
} from "lucide-react";

interface Stats {
    total: number;
    enrolled: number;
    unenrolled: number;
}

export default function StudentsHubPage() {
    const [stats, setStats] = useState<Stats>({ total: 0, enrolled: 0, unenrolled: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get("/students/enrolled"),
            api.get("/students/unenrolled"),
        ])
            .then(([enrolledRes, unenrolledRes]) => {
                const enrolled = enrolledRes.data.data.length;
                const unenrolled = unenrolledRes.data.data.length;
                setStats({ total: enrolled + unenrolled, enrolled, unenrolled });
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold">Student Management</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                    Manage student enrollment, registration, and records
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] card-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-[hsl(var(--primary))]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Students</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] card-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.enrolled}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Enrolled</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] card-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <UserX className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.unenrolled}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Unenrolled / Pending</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enrolled Card */}
                <Link
                    href="/admin/students/enrolled"
                    className="group bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))] card-shadow hover:card-shadow-lg hover:border-emerald-500/30 transition-all"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-emerald-500" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-[hsl(var(--muted-foreground))] group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-emerald-500 transition-colors">
                        Enrolled Students
                    </h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        View and manage students currently assigned to a grade level and section.
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="inline-flex px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                            {stats.enrolled} students
                        </span>
                    </div>
                </Link>

                {/* Unenrolled Card */}
                <Link
                    href="/admin/students/unenrolled"
                    className="group bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))] card-shadow hover:card-shadow-lg hover:border-amber-500/30 transition-all"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <UserX className="w-6 h-6 text-amber-500" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-[hsl(var(--muted-foreground))] group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-amber-500 transition-colors">
                        Unenrolled Students
                    </h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        View newly registered students who still need to be assigned a class and section.
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="inline-flex px-3 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-bold">
                            {stats.unenrolled} students
                        </span>
                    </div>
                </Link>
            </div>
        </div>
    );
}
