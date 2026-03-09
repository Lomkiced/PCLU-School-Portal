"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import {
    Search, Loader2, BookOpen, Plus,
    ChevronUp, ChevronDown, ChevronsUpDown, Edit, Trash2
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
    prerequisites: { id: string; code: string; name: string }[];
}

interface SubjectManagerProps {
    gradeLevelId: string;
}

type SortField = "code" | "name" | "units" | "subjectType";

const typeColors: Record<string, string> = {
    CORE: "bg-blue-500/10 text-blue-600",
    ELECTIVE: "bg-violet-500/10 text-violet-600",
    SPECIALIZED: "bg-amber-500/10 text-amber-600",
    HONORS: "bg-emerald-500/10 text-emerald-600",
    LAB: "bg-cyan-500/10 text-cyan-600",
};

export function SubjectManager({ gradeLevelId }: SubjectManagerProps) {
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

    // We can show more since we have the full width
    const pageSize = 15;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const subjectsRes = await api.get(`/subjects?gradeLevelId=${gradeLevelId}`);
            setSubjects(subjectsRes.data.data || []);
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
        } finally {
            setLoading(false);
        }
    }, [gradeLevelId]);

    useEffect(() => {
        if (gradeLevelId) fetchData();
    }, [gradeLevelId, fetchData]);

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
            fetchData();
        } catch { } // Error handling toast would go here if implemented
        setDeleting(false);
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 inline ml-1" />;
        return sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-[hsl(var(--primary))] inline ml-1" /> : <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--primary))] inline ml-1" />;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border border-[hsl(var(--border))] rounded-2xl bg-[hsl(var(--card))]">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
                <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Loading subjects...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        <input
                            type="text"
                            placeholder="Search by code, name, or department..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent hover:border-[hsl(var(--border))] text-sm font-medium placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all shadow-sm"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent hover:border-[hsl(var(--border))] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all shadow-sm w-full sm:w-auto"
                    >
                        <option value="">All Types</option>
                        <option value="CORE">Core</option>
                        <option value="ELECTIVE">Elective</option>
                        <option value="SPECIALIZED">Specialized</option>
                        <option value="HONORS">Honors</option>
                        <option value="LAB">Lab</option>
                    </select>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-primary-foreground text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md shadow-[hsl(var(--primary)/0.25)] flex-shrink-0"
                >
                    <Plus className="w-4 h-4" /> Add Subject
                </button>
            </div>

            {/* Stats Cards Row */}
            {subjects.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {["CORE", "ELECTIVE", "SPECIALIZED", "HONORS", "LAB"].map((type) => {
                        const count = subjects.filter((s) => s.subjectType === type).length;
                        if (count === 0) return null; // Only show relevant stats
                        return (
                            <div key={type} className="px-4 py-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm flex items-center justify-between">
                                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider ${typeColors[type]}`}>{type}</span>
                                <span className="text-xl font-bold">{count}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Main Data Table */}
            <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] text-left">
                                <th className="px-4 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] w-24">
                                    <button onClick={() => handleSort("code")} className="hover:text-[hsl(var(--foreground))] flex items-center">
                                        Code <SortIcon field="code" />
                                    </button>
                                </th>
                                <th className="px-4 py-3.5 font-semibold text-[hsl(var(--muted-foreground))]">
                                    <button onClick={() => handleSort("name")} className="hover:text-[hsl(var(--foreground))] flex items-center">
                                        Subject <SortIcon field="name" />
                                    </button>
                                </th>
                                <th className="px-4 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] hidden md:table-cell">Department</th>
                                <th className="px-4 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] w-24">
                                    <button onClick={() => handleSort("units")} className="hover:text-[hsl(var(--foreground))] flex items-center">
                                        Credits <SortIcon field="units" />
                                    </button>
                                </th>
                                <th className="px-4 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] hidden lg:table-cell w-32">Hours (L/Lab)</th>
                                <th className="px-4 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] hidden xl:table-cell">Prerequisites</th>
                                <th className="px-4 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] w-32">
                                    <button onClick={() => handleSort("subjectType")} className="hover:text-[hsl(var(--foreground))] flex items-center">
                                        Type <SortIcon field="subjectType" />
                                    </button>
                                </th>
                                <th className="px-4 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((s, i) => (
                                <tr key={s.id} className={`border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors ${i % 2 ? "bg-[hsl(var(--muted)/0.1)]" : ""}`}>
                                    <td className="px-4 py-3 font-mono text-xs font-bold text-[hsl(var(--primary))]">{s.code}</td>
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-sm truncate max-w-[200px] lg:max-w-xs">{s.name}</p>
                                        {s.description && <p className="text-xs text-[hsl(var(--muted-foreground))] truncate max-w-[200px] lg:max-w-xs" title={s.description}>{s.description}</p>}
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell text-xs text-[hsl(var(--muted-foreground))]">
                                        {s.department?.name || "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-bold text-sm bg-[hsl(var(--muted))] px-2 py-0.5 rounded-md">{s.credits}</span>
                                        <span className="text-xs text-[hsl(var(--muted-foreground))] ml-1">({s.units}u)</span>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-[hsl(var(--muted-foreground))]">
                                        {s.lectureHours}L / {s.labHours}Lab
                                    </td>
                                    <td className="px-4 py-3 hidden xl:table-cell">
                                        {s.prerequisites.length === 0 ? (
                                            <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {s.prerequisites.map((p) => (
                                                    <span key={p.id} className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" title={p.name}>
                                                        {p.code}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider ${typeColors[s.subjectType] || "bg-gray-500/10 text-gray-500"}`}>
                                            {s.subjectType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button className="p-1.5 rounded-lg hover:bg-amber-500/10 text-[hsl(var(--muted-foreground))] hover:text-amber-500 transition-colors" title="Edit">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(s)}
                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors"
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
                                    <td colSpan={8} className="text-center py-16 text-[hsl(var(--muted-foreground))]">
                                        <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-4">
                                            <BookOpen className="w-8 h-8 opacity-50" />
                                        </div>
                                        <h3 className="font-semibold text-lg text-[hsl(var(--foreground))] mb-1">No Subjects Found</h3>
                                        <p className="text-sm">{search || typeFilter ? "Try adjusting your search filters." : "Start by adding a subject to this curriculum."}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.1)]">
                        <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium">
                            Showing <span className="text-[hsl(var(--foreground))]">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-[hsl(var(--foreground))]">{Math.min(currentPage * pageSize, filtered.length)}</span> of <span className="text-[hsl(var(--foreground))]">{filtered.length}</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded-md text-xs font-semibold hover:bg-[hsl(var(--muted))] disabled:opacity-40 transition-colors">Prev</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                                // Simple pagination logic
                                if (totalPages > 5 && p !== 1 && p !== totalPages && Math.abs(p - currentPage) > 1) {
                                    if (p === 2 || p === totalPages - 1) return <span key={p} className="px-2 text-[hsl(var(--muted-foreground))]">...</span>;
                                    return null;
                                }
                                return (
                                    <button key={p} onClick={() => setCurrentPage(p)} className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors ${p === currentPage ? "bg-[hsl(var(--primary))] text-primary-foreground shadow-sm" : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"}`}>{p}</button>
                                )
                            })}
                            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md text-xs font-semibold hover:bg-[hsl(var(--muted))] disabled:opacity-40 transition-colors">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <CreateSubjectModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => { setShowCreateModal(false); fetchData(); }}
                gradeLevelId={gradeLevelId}
            />

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
                    <div className="relative bg-[hsl(var(--card))] rounded-2xl w-full max-w-sm shadow-2xl border border-[hsl(var(--border))] overflow-hidden flex flex-col">
                        <div className="p-6 space-y-3">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-xl text-[hsl(var(--foreground))]">Delete Subject</h3>
                            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                                Are you sure you want to delete <strong className="text-[hsl(var(--foreground))]">{deleteTarget.code}</strong>? This will remove all prerequisite links. This action cannot be undone.
                            </p>
                        </div>
                        <div className="p-4 bg-[hsl(var(--muted)/0.5)] border-t border-[hsl(var(--border))] flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[hsl(var(--muted))] disabled:opacity-50 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 active:scale-95 disabled:opacity-60 transition-all shadow-md">
                                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : "Delete Subject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
