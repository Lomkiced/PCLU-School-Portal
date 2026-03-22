"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import {
    Users, Search, Loader2, AlertCircle,
    ChevronUp, ChevronDown, ChevronsUpDown, Mail, User, BookOpen, Edit, School, Info
} from "lucide-react";
import { AssignTeacherModal } from "@/components/assign-section-subject-modal";
import { motion } from "framer-motion";

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Premium Hero Header */}
            <div className="relative overflow-hidden bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2rem] p-8 sm:p-10 shadow-sm transition-all duration-500 hover:shadow-md hover:border-primary/20 group">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000 ease-out">
                    <School className="w-64 h-64 text-primary" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-muted/50 border border-border/50 rounded-full text-xs font-bold tracking-widest uppercase text-muted-foreground backdrop-blur-sm">
                                {section.gradeLevel.name}
                            </span>
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/40"></div>
                            <span className="text-sm font-semibold text-primary flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                {section._count.students} / {section.capacity} Enrolled
                            </span>
                        </div>

                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-6">
                            {section.name}
                        </h2>

                        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/50 border border-border/30 backdrop-blur-sm pr-6">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                    <User className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-0.5">Section Adviser</p>
                                    <p className="font-semibold text-foreground">{section.adviser ? `${section.adviser.firstName} ${section.adviser.lastName}` : <span className="text-muted-foreground/50 italic">Unassigned</span>}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/50 border border-border/30 backdrop-blur-sm pr-6">
                                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                                    <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-0.5">Designated Room</p>
                                    <p className="font-semibold text-foreground">{section.room ? section.room.name : <span className="text-muted-foreground/50 italic">Unassigned</span>}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Capacity Ring */}
                    <div className="hidden lg:flex flex-col items-center justify-center shrink-0 w-32 h-32 relative">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" className="stroke-muted/40" strokeWidth="8" />
                            <circle
                                cx="50" cy="50" r="45" fill="none"
                                className="stroke-primary"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${(section._count.students / section.capacity) * 283} 283`}
                                style={{ transition: "stroke-dasharray 1.5s ease-out" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-foreground">
                                {Math.round((section._count.students / section.capacity) * 100)}%
                            </span>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">Filled</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sleek Animated Tabs */}
            <div className="flex p-1.5 bg-card/60 backdrop-blur-sm rounded-[1.25rem] border border-border/50 w-fit relative z-10 shadow-sm">
                <button
                    onClick={() => setActiveTab("students")}
                    className={`relative px-6 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-2.5 ${activeTab === "students" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                    {activeTab === "students" && (
                        <motion.div layoutId="tab-indicator" className="absolute inset-0 bg-background rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgb(0,0,0,0.2)] border border-border/50 -z-10" />
                    )}
                    <Users className="w-4 h-4" /> Enrolled Students
                    <span className="ml-1.5 bg-muted/80 text-foreground px-2 py-0.5 rounded-md text-xs">{section.students.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab("subjects")}
                    className={`relative px-6 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-2.5 ${activeTab === "subjects" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                    {activeTab === "subjects" && (
                        <motion.div layoutId="tab-indicator" className="absolute inset-0 bg-background rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgb(0,0,0,0.2)] border border-border/50 -z-10" />
                    )}
                    <BookOpen className="w-4 h-4" /> Curriculum Subjects
                    <span className="ml-1.5 bg-muted/80 text-foreground px-2 py-0.5 rounded-md text-xs">{inheritedSubjects.length}</span>
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

                    <div className="bg-card/40 backdrop-blur-sm rounded-[1.5rem] border border-border/50 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50 bg-muted/20">
                                        <th className="text-left px-6 py-4 font-bold text-muted-foreground whitespace-nowrap">
                                            <button onClick={() => handleSort("studentId")} className="flex items-center gap-1.5 hover:text-foreground transition-colors group">
                                                Student ID <SortIcon field="studentId" />
                                            </button>
                                        </th>
                                        <th className="text-left px-6 py-4 font-bold text-muted-foreground whitespace-nowrap">
                                            <button onClick={() => handleSort("lastName")} className="flex items-center gap-1.5 hover:text-foreground transition-colors group">
                                                Student Name <SortIcon field="lastName" />
                                            </button>
                                        </th>
                                        <th className="text-left px-6 py-4 font-bold text-muted-foreground hidden md:table-cell">Details</th>
                                        <th className="text-left px-6 py-4 font-bold text-muted-foreground hidden lg:table-cell">Contact</th>
                                        <th className="text-left px-6 py-4 font-bold text-muted-foreground whitespace-nowrap">
                                            <button onClick={() => handleSort("enrollmentStatus")} className="flex items-center gap-1.5 hover:text-foreground transition-colors group">
                                                Status <SortIcon field="enrollmentStatus" />
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedStudents.map((student) => (
                                        <tr key={student.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors group/row">
                                            <td className="px-6 py-4 font-mono text-xs font-semibold text-muted-foreground group-hover/row:text-foreground transition-colors">
                                                {student.studentId}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-[0.8rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10 group-hover/row:scale-105 transition-transform duration-300">
                                                        <User className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-foreground">
                                                            {student.lastName}, {student.firstName}
                                                            {student.middleName ? ` ${student.middleName.charAt(0)}.` : ""}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground/70 flex items-center gap-1.5 mt-0.5">
                                                            <Mail className="w-3 h-3" /> {student.user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase ${student.gender === "MALE" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                                                        student.gender === "FEMALE" ? "bg-pink-500/10 text-pink-500 border border-pink-500/20" :
                                                            "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                                                    }`}>
                                                    {student.gender}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 hidden lg:table-cell">
                                                <div className="text-xs space-y-1 text-muted-foreground">
                                                    <p className="font-semibold text-foreground">{student.parents?.[0] ? `${student.parents[0].firstName} ${student.parents[0].lastName}` : student.guardianName}</p>
                                                    <p className="opacity-80 font-mono">{student.parents?.[0]?.contactNumber || student.guardianContact}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.6rem] text-xs font-bold border ${statusColors[student.enrollmentStatus]?.replace("text-", "border-").replace("bg-", "border-") || "border-gray-500/20"} ${statusColors[student.enrollmentStatus] || "bg-gray-500/10 text-gray-500"}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${statusColors[student.enrollmentStatus]?.replace("bg-", "bg-").replace("/10", "")?.split(" ")[0] || "bg-gray-500"}`} />
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
                    <div className="bg-card/40 backdrop-blur-sm rounded-[1.5rem] border border-border/50 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50 bg-muted/20">
                                        <th className="text-left px-6 py-4 font-bold text-muted-foreground w-1/6">Subject Code</th>
                                        <th className="text-left px-6 py-4 font-bold text-muted-foreground w-2/6">Course Description</th>
                                        <th className="text-center px-6 py-4 font-bold text-muted-foreground w-1/12">Units</th>
                                        <th className="text-left px-6 py-4 font-bold text-muted-foreground w-1/6">Component Type</th>
                                        <th className="text-left px-6 py-4 font-bold text-muted-foreground w-1/4">Assigned Instructor</th>
                                        <th className="text-right px-6 py-4 font-bold text-muted-foreground">Manage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inheritedSubjects.map((subject) => (
                                        <tr key={subject.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors group/row">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm font-black text-primary bg-primary/10 px-3 py-1.5 rounded-md border border-primary/20">
                                                    {subject.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-foreground text-sm tracking-tight">{subject.name}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border mx-auto font-bold text-sm shadow-sm group-hover/row:border-primary/40 transition-colors">
                                                    {subject.units}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex px-2.5 py-1 rounded-[0.5rem] bg-muted text-foreground text-[10px] font-black tracking-widest uppercase border border-border/80 shadow-sm">
                                                    {subject.subjectType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {subject.teacher ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-inner group-hover/row:scale-105 transition-transform duration-300">
                                                            <User className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-foreground">{subject.teacher.lastName}, {subject.teacher.firstName}</p>
                                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5">{subject.teacher.employeeId}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                        <span className="text-xs text-amber-600 dark:text-amber-500 font-bold tracking-wide uppercase">
                                                            Pending Assignment
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setAssignTeacherData({
                                                        subjectId: subject.id,
                                                        subjectName: `${subject.code} — ${subject.name}`,
                                                        teacherId: subject.teacherId
                                                    })}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${subject.teacher ? 'bg-background hover:bg-muted border border-border hover:border-primary/30 text-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)] shadow-[0_0_10px_hsl(var(--primary)/0.2)]'}`}
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                    {subject.teacher ? "Reassign" : "Assign Staff"}
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
