"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import {
    Building2, Users, ChevronRight, Loader2, AlertCircle, Plus, Crown,
} from "lucide-react";
import { CreateDepartmentModal } from "@/components/create-department-modal";

interface Department {
    id: string;
    name: string;
    headTeacher: { firstName: string; lastName: string } | null;
    _count: { teachers: number };
}

export default function FacultyPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchDepartments = () => {
        setLoading(true);
        api.get("/departments")
            .then((res) => setDepartments(res.data.data))
            .catch(() => setError("Failed to load departments"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDepartments(); }, []);

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

    const totalTeachers = departments.reduce((sum, d) => sum + d._count.teachers, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">Faculty Management</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        Manage departments and faculty members
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md shadow-[hsl(var(--primary)/0.25)]"
                >
                    <Plus className="w-4 h-4" /> Create Department
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] card-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-[hsl(var(--primary))]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{departments.length}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Departments</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] card-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalTeachers}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Faculty</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Department Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                    <Link
                        key={dept.id}
                        href={`/admin/faculty/${dept.id}`}
                        className="group bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] card-shadow hover:card-shadow-lg hover:border-[hsl(var(--primary)/0.3)] transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-[hsl(var(--primary))]" />
                            </div>
                            <ChevronRight className="w-5 h-5 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="font-bold text-base mb-2 group-hover:text-[hsl(var(--primary))] transition-colors">
                            {dept.name}
                        </h3>
                        <div className="space-y-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                            <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" />
                                <span>{dept._count.teachers} faculty member{dept._count.teachers !== 1 ? "s" : ""}</span>
                            </div>
                            {dept.headTeacher && (
                                <div className="flex items-center gap-2">
                                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Head: {dept.headTeacher.firstName} {dept.headTeacher.lastName}</span>
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            {departments.length === 0 && (
                <div className="text-center py-16">
                    <Building2 className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground)/0.3)] mb-3" />
                    <p className="text-[hsl(var(--muted-foreground))] font-medium">No departments found</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground)/0.7)] mt-1">Create departments first to manage faculty.</p>
                </div>
            )}

            {/* Create Department Modal */}
            <CreateDepartmentModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => { setShowCreateModal(false); fetchDepartments(); }}
            />
        </div>
    );
}
