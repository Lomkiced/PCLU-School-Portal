"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import {
    ChevronRight, Home, Search, Loader2, BookOpen, Plus,
    ChevronUp, ChevronDown, ChevronsUpDown, Edit, Trash2,
} from "lucide-react";
import { CreateSubjectModal } from "@/components/create-subject-modal";

interface Subject {
    id: string;
    code: string;
    name: string;
    units: number;
    credits: number;
    lectureHours: number;
    labHours: number;
    description: string | null;
    subjectType: string;
    department: { id: string; name: string } | null;
    gradeLevel: { id: string; name: string } | null;
    prerequisites: { id: string; code: string; name: string }[];
}

type SortField = "code" | "name" | "units" | "subjectType";

const typeColors: Record<string, string> = {
    CORE: "bg-blue-500/10 text-blue-600",
    ELECTIVE: "bg-violet-500/10 text-violet-600",
    SPECIALIZED: "bg-amber-500/10 text-amber-600",
    HONORS: "bg-emerald-500/10 text-emerald-600",
    LAB: "bg-cyan-500/10 text-cyan-600",
};

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [sortField, setSortField] = useState<SortField>("code");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
    const [deleting, setDeleting] = useState(false);
    const pageSize = 15;

    const fetchSubjects = () => {
        setLoading(true);
        api.get("/subjects")
            .then((res) => setSubjects(res.data.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchSubjects(); }, []);

    const filtered = subjects
        .filter((s) => {
            const q = search.toLowerCase();
            const matchSearch = s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.department?.name || "").toLowerCase().includes(q);
            const matchType = !typeFilter || s.subjectType === typeFilter;
            return matchSearch && matchType;
        })
        .sort((a, b) => {
            const aVal = String((a as any)[sortField] ?? "");
            const bVal = String((b as any)[sortField] ?? "");
            return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("asc"); }
        setCurrentPage(1);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/subjects/${deleteTarget.id}`);
            setDeleteTarget(null);
            fetchSubjects();
        } catch { }
        setDeleting(false);
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
                <span className="text-[hsl(var(--foreground))] font-semibold">Subjects</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[hsl(var(--primary))]" /> Subject Management
                    </h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        {subjects.length} subject{subjects.length !== 1 ? "s" : ""} in the curriculum
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md shadow-[hsl(var(--primary)/0.25)]"
                >
                    <Plus className="w-4 h-4" /> Add Subject
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <input
                        type="text"
                        placeholder="Search by code, name, or department..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm font-medium placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all"
                >
                    <option value="">All Types</option>
                    <option value="CORE">Core</option>
                    <option value="ELECTIVE">Elective</option>
                    <option value="SPECIALIZED">Specialized</option>
                    <option value="HONORS">Honors</option>
                    <option value="LAB">Lab</option>
                </select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {["CORE", "ELECTIVE", "SPECIALIZED", "HONORS", "LAB"].map((type) => {
                    const count = subjects.filter((s) => s.subjectType === type).length;
                    return (
                        <div key={type} className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] card-shadow">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold ${typeColors[type]}`}>{type}</span>
                            <p className="text-xl font-bold mt-1">{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Table */}
            <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] card-shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))]">
                                    <button onClick={() => handleSort("code")} className="flex items-center gap-1 hover:text-[hsl(var(--foreground))]">
                                        Code <SortIcon field="code" />
                                    </button>
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))]">
                                    <button onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-[hsl(var(--foreground))]">
                                        Subject Name <SortIcon field="name" />
                                    </button>
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))] hidden md:table-cell">Department</th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))]">
                                    <button onClick={() => handleSort("units")} className="flex items-center gap-1 hover:text-[hsl(var(--foreground))]">
                                        Credits <SortIcon field="units" />
                                    </button>
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))] hidden lg:table-cell">Hours</th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))] hidden lg:table-cell">Prerequisites</th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))]">
                                    <button onClick={() => handleSort("subjectType")} className="flex items-center gap-1 hover:text-[hsl(var(--foreground))]">
                                        Type <SortIcon field="subjectType" />
                                    </button>
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((s, i) => (
                                <tr key={s.id} className={`border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors ${i % 2 ? "bg-[hsl(var(--muted)/0.15)]" : ""}`}>
                                    <td className="px-4 py-3 font-mono text-xs font-bold text-[hsl(var(--primary))]">{s.code}</td>
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-sm">{s.name}</p>
                                        {s.description && <p className="text-xs text-[hsl(var(--muted-foreground))] truncate max-w-xs">{s.description}</p>}
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell text-xs text-[hsl(var(--muted-foreground))]">
                                        {s.department?.name || "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-bold text-sm">{s.credits}</span>
                                        <span className="text-xs text-[hsl(var(--muted-foreground))]"> ({s.units}u)</span>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-[hsl(var(--muted-foreground))]">
                                        <span>{s.lectureHours}L / {s.labHours}Lab</span>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        {s.prerequisites.length === 0 ? (
                                            <span className="text-xs text-[hsl(var(--muted-foreground))]">None</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {s.prerequisites.map((p) => (
                                                    <span key={p.id} className="inline-flex px-2 py-0.5 rounded-md bg-[hsl(var(--muted))] text-xs font-semibold">{p.code}</span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${typeColors[s.subjectType] || "bg-gray-500/10 text-gray-500"}`}>
                                            {s.subjectType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button className="p-2 rounded-lg hover:bg-amber-500/10 text-[hsl(var(--muted-foreground))] hover:text-amber-500 transition-colors" title="Edit">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(s)}
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginated.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="font-medium">{search || typeFilter ? "No subjects match your filters" : "No subjects found. Add your first subject."}</p>
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

            {/* Create Modal */}
            <CreateSubjectModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => { setShowCreateModal(false); fetchSubjects(); }}
            />

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
                    <div className="relative bg-[hsl(var(--card))] rounded-2xl w-full max-w-sm shadow-2xl border border-[hsl(var(--border))] p-6 space-y-4">
                        <h3 className="font-bold text-base text-red-500">Delete Subject</h3>
                        <p className="text-sm">
                            Are you sure you want to delete <strong>{deleteTarget.code} — {deleteTarget.name}</strong>? This will remove all prerequisite links. This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="px-4 py-2 rounded-xl text-sm font-semibold border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] disabled:opacity-50">Cancel</button>
                            <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60">
                                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4" /> Delete</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
