"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import {
    ChevronRight, Home, Search, Loader2, AlertCircle,
    ChevronUp, ChevronDown, ChevronsUpDown, UserCheck, User, Plus,
} from "lucide-react";
import { AddStudentModal } from "@/components/add-student-modal";

interface Student {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    gender: string;
    enrollmentStatus: string;
    user: { email: string };
    gradeLevel: { name: string } | null;
    section: { name: string } | null;
}

type SortField = "lastName" | "studentId" | "enrollmentStatus";

export default function EnrolledStudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField>("lastName");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const pageSize = 15;

    const fetchStudents = () => {
        setLoading(true);
        api.get("/students/enrolled")
            .then((res) => setStudents(res.data.data))
            .catch(() => setError("Failed to load enrolled students"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchStudents(); }, []);

    const filtered = students
        .filter((s) => {
            const q = search.toLowerCase();
            return (
                s.firstName.toLowerCase().includes(q) ||
                s.lastName.toLowerCase().includes(q) ||
                s.studentId.toLowerCase().includes(q) ||
                s.user.email.toLowerCase().includes(q)
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <Link href="/admin" className="hover:text-[hsl(var(--foreground))] transition-colors flex items-center gap-1">
                    <Home className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href="/admin/students" className="hover:text-[hsl(var(--foreground))] transition-colors">
                    Students
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[hsl(var(--foreground))] font-semibold">Enrolled</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-emerald-500" /> Enrolled Students
                    </h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        {students.length} student{students.length !== 1 ? "s" : ""} currently enrolled and assigned to a section
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md shadow-[hsl(var(--primary)/0.25)]"
                >
                    <Plus className="w-4 h-4" /> Add Student
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                    type="text"
                    placeholder="Search by name, ID, or email..."
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
                                    <button onClick={() => handleSort("studentId")} className="flex items-center gap-1 hover:text-[hsl(var(--foreground))]">
                                        Student ID <SortIcon field="studentId" />
                                    </button>
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))]">
                                    <button onClick={() => handleSort("lastName")} className="flex items-center gap-1 hover:text-[hsl(var(--foreground))]">
                                        Name <SortIcon field="lastName" />
                                    </button>
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))] hidden md:table-cell">Email</th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))] hidden sm:table-cell">Grade Level</th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))] hidden sm:table-cell">Section</th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))]">
                                    <button onClick={() => handleSort("enrollmentStatus")} className="flex items-center gap-1 hover:text-[hsl(var(--foreground))]">
                                        Status <SortIcon field="enrollmentStatus" />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((s, i) => (
                                <tr key={s.id} className={`border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors ${i % 2 ? "bg-[hsl(var(--muted)/0.15)]" : ""}`}>
                                    <td className="px-4 py-3 font-mono text-xs text-[hsl(var(--muted-foreground))]">{s.studentId}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-[hsl(var(--primary))]" />
                                            </div>
                                            <span className="font-semibold">{s.lastName}, {s.firstName}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell text-xs text-[hsl(var(--muted-foreground))]">{s.user.email}</td>
                                    <td className="px-4 py-3 hidden sm:table-cell text-xs">{s.gradeLevel?.name ?? "—"}</td>
                                    <td className="px-4 py-3 hidden sm:table-cell text-xs">{s.section?.name ?? "—"}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600">
                                            {s.enrollmentStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {paginated.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                                        <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="font-medium">{search ? "No students match your search" : "No enrolled students found"}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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

            {/* Add Student Modal */}
            <AddStudentModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => { setShowAddModal(false); fetchStudents(); }}
            />
        </div>
    );
}
