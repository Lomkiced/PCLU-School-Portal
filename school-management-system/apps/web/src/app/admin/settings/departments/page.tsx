"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Building2, Plus, Loader2, AlertCircle, Users, Crown } from "lucide-react";
import { CreateDepartmentModal } from "@/components/create-department-modal";
import BreadcrumbNav, { BreadcrumbItem } from "@/components/BreadcrumbNav";

interface Department {
    id: string;
    name: string;
    headTeacher: { firstName: string; lastName: string } | null;
    _count: { teachers: number };
}

export default function DepartmentsSettingsPage() {
    // Data state
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchDepartments = () => {
        setLoading(true);
        api.get("/departments")
            .then((res) => setDepartments(res.data.data))
            .catch(() => setError("Failed to load departments data"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDepartments(); }, []);

    if (loading && departments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground font-medium">Loading department structure...</p>
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

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto min-h-[calc(100vh-8rem)] flex flex-col">

            {/* Header / Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <BreadcrumbNav items={[
                    { label: "Settings", href: "/admin/settings" },
                    { label: "Faculty Departments", href: "/admin/settings/departments" }
                ]} />

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-all shadow-md shadow-purple-600/25 shrink-0"
                >
                    <Plus className="w-4 h-4" /> Create Department
                </button>
            </div>

            {/* Main Content Area */}
            <div className="space-y-8">
                <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-purple-600" />
                        Faculty Departments
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        Establish organizational departments to categorize your faculty and assign specialized head teachers.
                    </p>
                </div>

                {/* Departments Grid */}
                {departments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {departments.map((dept) => (
                            <div
                                key={dept.id}
                                className="group bg-card rounded-2xl p-6 border border-border box-shadow-sm hover:box-shadow-md hover:border-purple-500/40 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-5">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>

                                <h3 className="font-bold text-xl mb-3 text-foreground group-hover:text-purple-600 transition-colors">
                                    {dept.name}
                                </h3>

                                <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                                    <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            <span className="font-medium">Faculty Limit</span>
                                        </div>
                                        <span className="font-bold text-foreground">{dept._count.teachers}</span>
                                    </div>

                                    <div className="px-1 text-xs mt-2">
                                        {dept.headTeacher ? (
                                            <div className="flex items-center gap-2">
                                                <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                                                <span className="truncate">
                                                    <span className="opacity-70">Head:</span> <span className="font-medium text-foreground">{dept.headTeacher.firstName} {dept.headTeacher.lastName}</span>
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="opacity-50 italic">No head assigned</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed shadow-sm">
                        <div className="w-20 h-20 bg-purple-500/5 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Building2 className="w-10 h-10 text-purple-600/50" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-foreground">No Departments Configured</h3>
                        <p className="text-muted-foreground font-medium max-w-md mx-auto">Create organizational departments before registering staff.</p>
                    </div>
                )}
            </div>

            {/* Modals integrated natively */}
            <CreateDepartmentModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => { setShowCreateModal(false); fetchDepartments(); }}
            />
        </div>
    );
}
