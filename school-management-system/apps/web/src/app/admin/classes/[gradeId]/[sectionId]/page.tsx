"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ChevronRight, Home, Users, Search, Loader2, AlertCircle,
    ChevronUp, ChevronDown, ChevronsUpDown, Mail, User,
} from "lucide-react";

interface Student {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    gender: string;
    enrollmentStatus: string;
    guardianName: string;
    guardianContact: string;
    user: { email: string; profilePicture: string | null };
    parents: { firstName: string; lastName: string; contactNumber: string }[];
}

interface SectionDetail {
    id: string;
    name: string;
    capacity: number;
    adviser: { firstName: string; lastName: string } | null;
    room: { name: string } | null;
    gradeLevel: { id: string; name: string };
    students: Student[];
    _count: { students: number };
}

type SortField = "lastName" | "studentId" | "gender" | "enrollmentStatus";

const statusColors: Record<string, string> = {
    ENROLLED: "bg-emerald-500/10 text-emerald-600",
    DROPPED: "bg-red-500/10 text-red-500",
    GRADUATED: "bg-blue-500/10 text-blue-500",
    TRANSFERRED: "bg-amber-500/10 text-amber-600",
    PENDING: "bg-gray-500/10 text-gray-500",
};

export default function SectionDetailPage() {
    const params = useParams();
    const gradeId = params.gradeId as string;
    const sectionId = params.sectionId as string;

    const [section, setSection] = useState<SectionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField>("lastName");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        api.get(`/sections/${sectionId}`)
            .then((res) => setSection(res.data.data))
            .catch(() => setError("Failed to load section"))
            .finally(() => setLoading(false));
    }, [sectionId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        );
    }

    if (error || !section) {
        return (
            <div className="flex items-center justify-center h-64 gap-3 text-[hsl(var(--destructive))]">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">{error || "Section not found"}</p>
            </div>
        );
    }

    // Filter & sort
    const filtered = section.students
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
            const aVal = a[sortField] ?? "";
            const bVal = b[sortField] ?? "";
            return sortDir === "asc"
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDir("asc");
        }
        setCurrentPage(1);
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />;
        return sortDir === "asc"
            ? <ChevronUp className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
            : <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />;
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] flex-wrap">
                <Link href="/admin" className="hover:text-[hsl(var(--foreground))] transition-colors flex items-center gap-1">
                    <Home className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href="/admin/classes" className="hover:text-[hsl(var(--foreground))] transition-colors">
                    Classes
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={`/admin/classes/${gradeId}`} className="hover:text-[hsl(var(--foreground))] transition-colors">
                    {section.gradeLevel.name}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[hsl(var(--foreground))] font-semibold">{section.name}</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">
                        {section.gradeLevel.name} — {section.name}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        <span>{section._count.students} / {section.capacity} students</span>
                        {section.adviser && (
                            <>
                                <span>•</span>
                                <span>Adviser: {section.adviser.firstName} {section.adviser.lastName}</span>
                            </>
                        )}
                        {section.room && (
                            <>
                                <span>•</span>
                                <span>Room: {section.room.name}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm font-medium placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all"
                />
            </div>

            {/* Data Table */}
            <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] card-shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))]">
                                    <button onClick={() => handleSort("studentId")} className="flex items-center gap-1 hover:text-[hsl(var(--foreground))] transition-colors">
                                        Student ID <SortIcon field="studentId" />
                                    </button>
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))]">
                                    <button onClick={() => handleSort("lastName")} className="flex items-center gap-1 hover:text-[hsl(var(--foreground))] transition-colors">
                                        Name <SortIcon field="lastName" />
                                    </button>
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))] hidden md:table-cell">
                                    <button onClick={() => handleSort("gender")} className="flex items-center gap-1 hover:text-[hsl(var(--foreground))] transition-colors">
                                        Gender <SortIcon field="gender" />
                                    </button>
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))] hidden lg:table-cell">
                                    Email
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))] hidden lg:table-cell">
                                    Guardian
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))]">
                                    <button onClick={() => handleSort("enrollmentStatus")} className="flex items-center gap-1 hover:text-[hsl(var(--foreground))] transition-colors">
                                        Status <SortIcon field="enrollmentStatus" />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((student, i) => (
                                <tr
                                    key={student.id}
                                    className={`border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors ${i % 2 === 0 ? "" : "bg-[hsl(var(--muted)/0.15)]"}`}
                                >
                                    <td className="px-4 py-3 font-mono text-xs text-[hsl(var(--muted-foreground))]">
                                        {student.studentId}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-[hsl(var(--primary))]" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">
                                                    {student.lastName}, {student.firstName}
                                                    {student.middleName ? ` ${student.middleName.charAt(0)}.` : ""}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold ${student.gender === "MALE" ? "bg-blue-500/10 text-blue-500" :
                                                student.gender === "FEMALE" ? "bg-pink-500/10 text-pink-500" :
                                                    "bg-gray-500/10 text-gray-500"
                                            }`}>
                                            {student.gender === "MALE" ? "Male" : student.gender === "FEMALE" ? "Female" : student.gender === "OTHER" ? "Other" : student.gender}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                                            <Mail className="w-3.5 h-3.5" />
                                            {student.user.email}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-[hsl(var(--muted-foreground))]">
                                        <p className="font-medium">{student.parents?.[0] ? `${student.parents[0].firstName} ${student.parents[0].lastName}` : student.guardianName}</p>
                                        <p>{student.parents?.[0]?.contactNumber || student.guardianContact}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${statusColors[student.enrollmentStatus] || "bg-gray-500/10 text-gray-500"}`}>
                                            {student.enrollmentStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {paginated.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="font-medium">
                                            {search ? "No students match your search" : "No students enrolled in this section"}
                                        </p>
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
                            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} students
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] disabled:opacity-40 transition-colors"
                            >
                                Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === currentPage ? "bg-[hsl(var(--primary))] text-white" : "hover:bg-[hsl(var(--muted))]"}`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] disabled:opacity-40 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
