"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ChevronRight, Home, Loader2, AlertCircle, Building2, Users, User,
    Search, ChevronUp, ChevronDown, ChevronsUpDown, Plus, Crown,
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

type SortField = "lastName" | "employeeId" | "position";

export default function DepartmentDetailPage() {
    const params = useParams();
    const departmentId = params.departmentId as string;
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
            .catch(() => setError("Failed to load department"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDepartment(); }, [departmentId]);

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
        if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />;
        return sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-[hsl(var(--primary))]" /> : <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />;
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <Link href="/admin" className="hover:text-[hsl(var(--foreground))] transition-colors flex items-center gap-1">
                    <Home className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href="/admin/faculty" className="hover:text-[hsl(var(--foreground))] transition-colors">
                    Faculty
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[hsl(var(--foreground))] font-semibold">{department.name}</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[hsl(var(--primary))]" /> {department.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                        <span>{department._count.teachers} faculty member{department._count.teachers !== 1 ? "s" : ""}</span>
                        {department.headTeacher && (
                            <>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                                    Head: {department.headTeacher.firstName} {department.headTeacher.lastName}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md shadow-[hsl(var(--primary)/0.25)]"
                >
                    <Plus className="w-4 h-4" /> Add Faculty
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                    type="text"
                    placeholder="Search by name, ID, email, or position..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm font-medium placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all"
                />
            </div>

            {/* Table */}
            <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] card-shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))]">
                                    <button onClick={() => handleSort("employeeId")} className="flex items-center gap-1 hover:text-[hsl(var(--foreground))]">
                                        Employee ID <SortIcon field="employeeId" />
                                    </button>
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))]">
                                    <button onClick={() => handleSort("lastName")} className="flex items-center gap-1 hover:text-[hsl(var(--foreground))]">
                                        Name <SortIcon field="lastName" />
                                    </button>
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))] hidden md:table-cell">Email</th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))]">
                                    <button onClick={() => handleSort("position")} className="flex items-center gap-1 hover:text-[hsl(var(--foreground))]">
                                        Position <SortIcon field="position" />
                                    </button>
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))] hidden sm:table-cell">Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((t, i) => (
                                <tr key={t.id} className={`border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors ${i % 2 ? "bg-[hsl(var(--muted)/0.15)]" : ""}`}>
                                    <td className="px-4 py-3 font-mono text-xs text-[hsl(var(--muted-foreground))]">{t.employeeId}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-[hsl(var(--primary))]" />
                                            </div>
                                            <span className="font-semibold">{t.lastName}, {t.firstName}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell text-xs text-[hsl(var(--muted-foreground))]">{t.user.email}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-600">
                                            {t.position}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-[hsl(var(--muted-foreground))]">{t.contactNumber}</td>
                                </tr>
                            ))}
                            {paginated.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="font-medium">{search ? "No faculty match your search" : "No faculty members in this department"}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[hsl(var(--border))]">
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] disabled:opacity-40 transition-colors">Prev</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === currentPage ? "bg-[hsl(var(--primary))] text-white" : "hover:bg-[hsl(var(--muted))]"}`}>{p}</button>
                            ))}
                            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] disabled:opacity-40 transition-colors">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Faculty Modal */}
            <AddFacultyModal
                open={showAddModal}
                departmentId={departmentId}
                departmentName={department.name}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => { setShowAddModal(false); fetchDepartment(); }}
            />
        </div>
    );
}
