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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Premium Hero Header */}
            <div className="relative overflow-hidden bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2rem] p-8 sm:p-10 shadow-sm transition-all duration-500 hover:shadow-md hover:border-primary/20 group">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-1000 ease-out">
                    <Building2 className="w-64 h-64 text-primary" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full text-xs font-bold tracking-widest uppercase backdrop-blur-sm">
                                Department
                            </span>
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/40"></div>
                            <span className="text-sm font-semibold text-primary flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                {department._count.teachers} Total Faculty
                            </span>
                        </div>

                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-6">
                            {department.name}
                        </h2>

                        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/50 border border-border/30 backdrop-blur-sm pr-6">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${department.headTeacher ? 'bg-amber-500/10 border-amber-500/20' : 'bg-muted border-border/50'}`}>
                                    <Crown className={`w-5 h-5 ${department.headTeacher ? 'text-amber-500' : 'text-muted-foreground/50'}`} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-0.5">Department Head</p>
                                    <p className="font-semibold text-foreground">{department.headTeacher ? `${department.headTeacher.firstName} ${department.headTeacher.lastName}` : <span className="text-muted-foreground/50 italic">Unassigned</span>}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search by name, ID, position..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-11 pr-4 py-3 rounded-[1rem] bg-card/60 backdrop-blur-sm border border-border/50 text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-card/40 backdrop-blur-sm rounded-[1.5rem] border border-border/50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50 bg-muted/20">
                                <th className="text-left px-6 py-4 font-bold text-muted-foreground whitespace-nowrap">
                                    <button onClick={() => handleSort("employeeId")} className="flex items-center gap-1.5 hover:text-foreground transition-colors group">
                                        Employee ID <SortIcon field="employeeId" />
                                    </button>
                                </th>
                                <th className="text-left px-6 py-4 font-bold text-muted-foreground whitespace-nowrap">
                                    <button onClick={() => handleSort("lastName")} className="flex items-center gap-1.5 hover:text-foreground transition-colors group">
                                        Faculty Name <SortIcon field="lastName" />
                                    </button>
                                </th>
                                <th className="text-left px-6 py-4 font-bold text-muted-foreground hidden md:table-cell">Contact Details</th>
                                <th className="text-left px-6 py-4 font-bold text-muted-foreground whitespace-nowrap">
                                    <button onClick={() => handleSort("position")} className="flex items-center gap-1.5 hover:text-foreground transition-colors group">
                                        Position <SortIcon field="position" />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((t) => (
                                <tr key={t.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors group/row">
                                    <td className="px-6 py-4 font-mono text-xs font-semibold text-muted-foreground group-hover/row:text-foreground transition-colors">
                                        {t.employeeId}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-[0.8rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10 group-hover/row:scale-105 transition-transform duration-300">
                                                <User className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-foreground">
                                                    {t.lastName}, {t.firstName}
                                                    {t.middleName ? ` ${t.middleName.charAt(0)}.` : ""}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <div className="text-xs space-y-1 text-muted-foreground">
                                            <p className="font-medium text-foreground">{t.user.email}</p>
                                            <p className="opacity-80 font-mono">{t.contactNumber && t.contactNumber !== 'N/A' ? t.contactNumber : 'No Contact Info'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-2.5 py-1 rounded-[0.5rem] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black tracking-widest uppercase border border-indigo-500/20 shadow-sm">
                                            {t.position}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {paginated.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-16 text-muted-foreground bg-muted/10">
                                        <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Users className="w-8 h-8 opacity-40" />
                                        </div>
                                        <p className="font-bold text-lg text-foreground mb-1">{search ? "No matches found" : "No faculty members yet"}</p>
                                        <p className="text-sm opacity-80">{search ? "Try adjusting your search terms" : "This department is currently empty"}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/20">
                        <p className="text-xs text-muted-foreground font-semibold">
                            Showing <span className="text-foreground font-bold">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)}</span> of <span className="text-foreground font-bold">{filtered.length}</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-background border border-border hover:bg-muted disabled:opacity-50 transition-colors shadow-sm">Prev</button>
                            <div className="flex items-center gap-1 mx-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${p === currentPage ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.2)]" : "bg-transparent border border-transparent hover:bg-muted text-muted-foreground"}`}>{p}</button>
                                ))}
                            </div>
                            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-background border border-border hover:bg-muted disabled:opacity-50 transition-colors shadow-sm">Next</button>
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
