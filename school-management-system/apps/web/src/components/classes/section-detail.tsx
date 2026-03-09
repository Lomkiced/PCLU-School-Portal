"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import {
    Users, Search, Loader2, AlertCircle,
    ChevronUp, ChevronDown, ChevronsUpDown, Mail, User, BookOpen, Edit
} from "lucide-react";
import { AssignTeacherModal } from "@/components/assign-section-subject-modal";

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

interface InheritedSubject {
    id: string;
    code: string;
    name: string;
    units: number;
    subjectType: string;
    assignmentId: string | null;
    teacherId: string | null;
    teacher: {
        id: string;
        firstName: string;
        lastName: string;
        employeeId: string;
    } | null;
}

interface SectionDetailData {
    id: string;
    name: string;
    capacity: number;
    adviser: { firstName: string; lastName: string } | null;
    room: { name: string } | null;
    gradeLevel: { id: string; name: string };
    students: Student[];
    _count: { students: number };
}

interface SectionDetailProps {
    sectionId: string;
    gradeId: string;
}

type SortField = "lastName" | "studentId" | "gender" | "enrollmentStatus";

const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-600",
    PROMOTED: "bg-indigo-500/10 text-indigo-600",
    RETAINED: "bg-amber-500/10 text-amber-600",
    DROPPED: "bg-red-500/10 text-red-500",
    GRADUATED: "bg-blue-500/10 text-blue-500",
};

export function SectionDetail({ sectionId, gradeId }: SectionDetailProps) {
    const [section, setSection] = useState<SectionDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    // Tabs
    const [activeTab, setActiveTab] = useState<"students" | "subjects">("students");

    const [inheritedSubjects, setInheritedSubjects] = useState<InheritedSubject[]>([]);

    // Modals
    const [assignTeacherData, setAssignTeacherData] = useState<{ subjectId: string, subjectName: string, teacherId: string | null } | null>(null);

    // Pagination/Sorting
    const [sortField, setSortField] = useState<SortField>("lastName");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const fetchSection = async () => {
        setLoading(true);
        try {
            const [secRes, subjRes] = await Promise.all([
                api.get(`/sections/${sectionId}`),
                api.get(`/sections/${sectionId}/subjects`)
            ]);
            setSection(secRes.data.data);
            setInheritedSubjects(subjRes.data.data || []);
        } catch (err) {
            setError("Failed to load section details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (sectionId) {
            fetchSection();
        }
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

    // Filter & sort students
    const filteredStudents = section.students
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

    const totalPages = Math.ceil(filteredStudents.length / pageSize);
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
        if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 ml-1 inline-block" />;
        return sortDir === "asc"
            ? <ChevronUp className="w-3.5 h-3.5 text-[hsl(var(--primary))] ml-1 inline-block" />
            : <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--primary))] ml-1 inline-block" />;
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            {section.gradeLevel.name} — {section.name}
                            <span className="px-2.5 py-1 bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs font-bold rounded-full">
                                {section._count.students} / {section.capacity}
                            </span>
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 opacity-70" />
                                <span>Adviser: <strong className="text-[hsl(var(--foreground))] font-semibold">{section.adviser ? `${section.adviser.firstName} ${section.adviser.lastName}` : 'Unassigned'}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 opacity-70" />
                                <span>Room: <strong className="text-[hsl(var(--foreground))] font-semibold">{section.room ? section.room.name : 'Unassigned'}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Interactive Tabs */}
            <div className="flex p-1 bg-[hsl(var(--muted)/0.5)] rounded-xl border border-[hsl(var(--border)/0.5)] w-fit">
                <button
                    onClick={() => setActiveTab("students")}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === "students" ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}
                >
                    <Users className="w-4 h-4" /> Enrolled Students ({section.students.length})
                </button>
                <button
                    onClick={() => setActiveTab("subjects")}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === "subjects" ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}
                >
                    <BookOpen className="w-4 h-4" /> Curriculum Subjects ({inheritedSubjects.length})
                </button>
            </div>

            {/* Tab: STUDENTS */}
            {activeTab === "students" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm font-medium placeholder:text-[hsl(var(--muted-foreground)/0.7)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all shadow-sm"
                        />
                    </div>

                    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
                                        <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                                            <button onClick={() => handleSort("studentId")} className="hover:text-[hsl(var(--foreground))] transition-colors">
                                                Student ID <SortIcon field="studentId" />
                                            </button>
                                        </th>
                                        <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                                            <button onClick={() => handleSort("lastName")} className="hover:text-[hsl(var(--foreground))] transition-colors">
                                                Name <SortIcon field="lastName" />
                                            </button>
                                        </th>
                                        <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] hidden md:table-cell">Gender</th>
                                        <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] hidden lg:table-cell">Email</th>
                                        <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] hidden lg:table-cell">Guardian</th>
                                        <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                                            <button onClick={() => handleSort("enrollmentStatus")} className="hover:text-[hsl(var(--foreground))] transition-colors">
                                                Status <SortIcon field="enrollmentStatus" />
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedStudents.map((student) => (
                                        <tr key={student.id} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                                            <td className="px-5 py-3.5 font-mono text-xs text-[hsl(var(--muted-foreground))]">{student.studentId}</td>
                                            <td className="px-5 py-3.5">
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
                                            <td className="px-5 py-3.5 hidden md:table-cell">
                                                <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold ${student.gender === "MALE" ? "bg-blue-500/10 text-blue-500" : student.gender === "FEMALE" ? "bg-pink-500/10 text-pink-500" : "bg-gray-500/10 text-gray-500"}`}>
                                                    {student.gender === "MALE" ? "Male" : student.gender === "FEMALE" ? "Female" : student.gender === "OTHER" ? "Other" : student.gender}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 hidden lg:table-cell">
                                                <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                                                    <Mail className="w-3.5 h-3.5" /> {student.user.email}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-[hsl(var(--muted-foreground))]">
                                                <p className="font-medium text-[hsl(var(--foreground))]">{student.parents?.[0] ? `${student.parents[0].firstName} ${student.parents[0].lastName}` : student.guardianName}</p>
                                                <p>{student.parents?.[0]?.contactNumber || student.guardianContact}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border border-current/20 ${statusColors[student.enrollmentStatus] || "bg-gray-500/10 text-gray-500"}`}>
                                                    {student.enrollmentStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedStudents.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-16 text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted)/0.1)]">
                                                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                                <p className="font-medium text-lg">{search ? "No students match your search" : "No students enrolled in this section"}</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.2)]">
                                <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium">
                                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length} students
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[hsl(var(--background))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] disabled:opacity-50 transition-colors">Previous</button>
                                    <div className="flex items-center gap-1 mx-2">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${page === currentPage ? "bg-[hsl(var(--primary))] text-primary-foreground shadow-md shadow-[hsl(var(--primary)/0.2)]" : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"}`}>{page}</button>
                                        ))}
                                    </div>
                                    <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[hsl(var(--background))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] disabled:opacity-50 transition-colors">Next</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab: SUBJECTS */}
            {activeTab === "subjects" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
                                        <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))]">Code</th>
                                        <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))]">Subject Name</th>
                                        <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))]">Units</th>
                                        <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))]">Type</th>
                                        <th className="text-left px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))]">Assigned Teacher</th>
                                        <th className="text-right px-5 py-3.5 font-semibold text-[hsl(var(--muted-foreground))]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inheritedSubjects.map((subject, i) => (
                                        <tr key={subject.id} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                                            <td className="px-5 py-3.5 font-mono text-xs font-bold text-[hsl(var(--primary))]">{subject.code}</td>
                                            <td className="px-5 py-3.5 font-semibold">{subject.name}</td>
                                            <td className="px-5 py-3.5 text-xs text-[hsl(var(--muted-foreground))]">{subject.units}u</td>
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex px-2 py-0.5 rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-xs font-bold border border-[hsl(var(--border))]">
                                                    {subject.subjectType}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {subject.teacher ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
                                                            <User className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-xs text-[hsl(var(--foreground))]">{subject.teacher.lastName}, {subject.teacher.firstName}</p>
                                                            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{subject.teacher.employeeId}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-amber-600 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    onClick={() => setAssignTeacherData({
                                                        subjectId: subject.id,
                                                        subjectName: `${subject.code} — ${subject.name}`,
                                                        teacherId: subject.teacherId
                                                    })}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--primary))] hover:text-primary-foreground hover:border-[hsl(var(--primary))] text-xs font-semibold transition-all shadow-sm"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                    {subject.teacher ? "Change" : "Assign"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {inheritedSubjects.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-16 text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted)/0.1)]">
                                                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                                <p className="font-medium text-lg">No subjects found for this section.</p>
                                                <Link
                                                    href={`/admin/subjects`}
                                                    className="mt-3 text-sm font-semibold text-[hsl(var(--primary))] hover:underline inline-block"
                                                >
                                                    Go to Curriculum Manager
                                                </Link>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            <AssignTeacherModal
                open={!!assignTeacherData}
                sectionId={sectionId}
                subjectId={assignTeacherData?.subjectId || ""}
                subjectName={assignTeacherData?.subjectName || ""}
                currentTeacherId={assignTeacherData?.teacherId}
                onClose={() => setAssignTeacherData(null)}
                onSuccess={() => { setAssignTeacherData(null); fetchSection(); }}
            />
        </div>
    );
}
