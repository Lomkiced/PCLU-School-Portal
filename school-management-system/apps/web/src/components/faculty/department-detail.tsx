"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
    Loader2, AlertCircle, Building2, Users, User,
    Search, ChevronUp, ChevronDown, ChevronsUpDown, Crown
} from "lucide-react";
import { AddFacultyModal } from "@/components/add-faculty-modal";

interface Teacher {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    position: string;
    contactNumber: string;
    user: { email: string };
}

interface Department {
    id: string;
    name: string;
    headTeacher: { firstName: string; lastName: string } | null;
    teachers: Teacher[];
    _count: { teachers: number };
}

interface DepartmentDetailProps {
    departmentId: string;
}

type SortField = "lastName" | "employeeId" | "position";

export function DepartmentDetail({ departmentId }: DepartmentDetailProps) {
    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField>("lastName");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const pageSize = 15;

    const fetchDepartment = () => {
        setLoading(true);
        api.get(`/departments/${departmentId}`)
            .then((res) => setDepartment(res.data.data))
            .catch(() => setError("Failed to load department details"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (departmentId) {
            fetchDepartment();
        }
    }, [departmentId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        );
    }

    if (error || !department) {
        return (
            <div className="flex items-center justify-center h-64 gap-3 text-[hsl(var(--destructive))]">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">{error || "Department not found"}</p>
            </div>
        );
    }

    const filtered = department.teachers
        .filter((t) => {
            const q = search.toLowerCase();
            return (
                t.firstName.toLowerCase().includes(q) ||
                t.lastName.toLowerCase().includes(q) ||
                t.employeeId.toLowerCase().includes(q) ||
                t.user.email.toLowerCase().includes(q) ||
                t.position.toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            const aVal = String(a[sortField] ?? "");
            const bVal = String(b[sortField] ?? "");
            return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("asc"); }
        setCurrentPage(1);
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 ml-1 inline-block" />;
        return sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-[hsl(var(--primary))] ml-1 inline-block" /> : <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--primary))] ml-1 inline-block" />;
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Building2 className="w-6 h-6 text-[hsl(var(--primary))]" /> {department.name}
                            <span className="px-2.5 py-1 bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs font-bold rounded-full">
                                {department._count.teachers}
                            </span>
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                            <div className="flex items-center gap-2">
                                <Crown className="w-4 h-4 text-amber-500" />
                                <span>Head: <strong className="text-[hsl(var(--foreground))] font-semibold">{department.headTeacher ? `${department.headTeacher.firstName} ${department.headTeacher.lastName}` : 'Unassigned'}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                    type="text"
                    placeholder="Search by name, ID, email..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm font-medium placeholder:text-[hsl(var(--muted-foreground)/0.7)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all shadow-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
                                <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                                    <button onClick={() => handleSort("employeeId")} className="hover:text-[hsl(var(--foreground))] transition-colors">
                                        Employee ID <SortIcon field="employeeId" />
                                    </button>
                                </th>
                                <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                                    <button onClick={() => handleSort("lastName")} className="hover:text-[hsl(var(--foreground))] transition-colors">
                                        Name <SortIcon field="lastName" />
                                    </button>
                                </th>
                                <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] hidden md:table-cell">Email</th>
                                <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                                    <button onClick={() => handleSort("position")} className="hover:text-[hsl(var(--foreground))] transition-colors">
                                        Position <SortIcon field="position" />
                                    </button>
                                </th>
                                <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] hidden sm:table-cell">Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((t) => (
                                <tr key={t.id} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                                    <td className="px-5 py-3.5 font-mono text-xs text-[hsl(var(--muted-foreground))]">{t.employeeId}</td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-[hsl(var(--primary))]" />
                                            </div>
                                            <span className="font-semibold text-sm">{t.lastName}, {t.firstName}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 hidden md:table-cell text-xs text-[hsl(var(--muted-foreground))] font-medium">{t.user.email}</td>
                                    <td className="px-5 py-3.5">
                                        <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border border-current/20 bg-indigo-500/10 text-indigo-600">
                                            {t.position}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 hidden sm:table-cell text-xs text-[hsl(var(--muted-foreground))] font-medium">
                                        {t.contactNumber && t.contactNumber !== 'N/A' ? t.contactNumber : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                            {paginated.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-16 text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted)/0.1)]">
                                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium text-lg">{search ? "No faculty match your search" : "No faculty members in this department"}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.2)]">
                        <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium">
                            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[hsl(var(--background))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] disabled:opacity-50 transition-colors">Previous</button>
                            <div className="flex items-center gap-1 mx-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${p === currentPage ? "bg-[hsl(var(--primary))] text-primary-foreground shadow-md shadow-[hsl(var(--primary)/0.2)]" : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"}`}>{p}</button>
                                ))}
                            </div>
                            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[hsl(var(--background))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] disabled:opacity-50 transition-colors">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Faculty Modal */}
            <AddFacultyModal
                open={showAddModal}
                departmentId={departmentId}
                departmentName={department?.name || ""}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => { setShowAddModal(false); fetchDepartment(); }}
            />
        </div>
    );
}
