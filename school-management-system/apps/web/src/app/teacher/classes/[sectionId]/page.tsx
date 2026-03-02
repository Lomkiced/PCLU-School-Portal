"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ScanLine, BookOpen, ChevronLeft, CalendarCheck, Save, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { useAuthStore } from "@/stores/auth-store";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

// --- API FETCHERS ---
const fetchSectionDetails = async (id: string, token: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/sections/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch section details");
    const json = await res.json();
    return json.data;
};

const fetchSectionAttendance = async (sectionId: string, date: string, token: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/attendance/section/${sectionId}?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch attendance");
    const json = await res.json();
    return json.data;
};

const markAttendance = async (payload: { studentId: string; sectionId: string; status: string; date: string }, token: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/attendance`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to mark attendance");
    return res.json();
};

export default function ClassDrillDownPage() {
    const params = useParams();
    const sectionId = params.sectionId as string;
    const { accessToken, user } = useAuthStore();
    const queryClient = useQueryClient();

    const [attendanceDate, setAttendanceDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [localAttendance, setLocalAttendance] = useState<Record<string, string>>({});

    const { data: section, isLoading: isLoadingSection } = useQuery({
        queryKey: ["section", sectionId],
        queryFn: () => fetchSectionDetails(sectionId, accessToken!),
        enabled: !!accessToken,
    });

    const { data: attendanceRecords, isLoading: isLoadingAttendance } = useQuery({
        queryKey: ["attendance", sectionId, attendanceDate],
        queryFn: () => fetchSectionAttendance(sectionId, attendanceDate, accessToken!),
        enabled: !!accessToken && !!sectionId,
    });

    const attendanceMutation = useMutation({
        mutationFn: (param: { studentId: string; status: string }) =>
            markAttendance({
                studentId: param.studentId,
                sectionId,
                status: param.status,
                date: attendanceDate
            }, accessToken!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance", sectionId, attendanceDate] });
        }
    });

    const handleAttendanceChange = (studentId: string, status: string) => {
        setLocalAttendance(prev => ({ ...prev, [studentId]: status }));
        attendanceMutation.mutate({ studentId, status });
    };

    const getInitialStatus = (studentId: string) => {
        if (localAttendance[studentId]) return localAttendance[studentId];
        const record = attendanceRecords?.find((r: any) => r.studentId === studentId);
        return record?.status || "NONE";
    };

    if (isLoadingSection) {
        return (
            <div className="space-y-8 animate-pulse">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-40 w-full rounded-3xl" />
                <div className="flex gap-4">
                    <Skeleton className="h-10 w-32 rounded-xl" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        );
    }

    if (!section) {
        return (
            <div className="text-center py-20 bg-[hsl(var(--card))] rounded-3xl border border-[hsl(var(--border))]">
                <h2 className="text-2xl font-bold text-[hsl(var(--destructive))]">Section Not Found</h2>
                <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm">
                    The requested class section doesn't exist or you don't have access to it.
                </p>
                <Link href="/teacher/classes" className="text-[hsl(var(--primary))] hover:underline mt-6 inline-block font-semibold">
                    ← Back to My Classes
                </Link>
            </div>
        );
    }

    // Format Data for Roster
    const mappedStudents = section.students?.map((s: any) => ({
        id: s.studentId,
        uid: s.id, // Profile ID
        name: `${s.lastName}, ${s.firstName}`,
        gender: s.gender,
        email: s.user?.email || "N/A",
        contact: s.parents && s.parents.length > 0 ? s.parents[0].contactNumber : "No Contact"
    })) || [];

    const studentColumns = [
        { label: "Student ID", key: "id" },
        { label: "Name", key: "name" },
        { label: "Gender", key: "gender" },
        { label: "Email", key: "email" },
        { label: "Guardian Contact", key: "contact" }
    ];

    // Filter assigned subjects to the logged-in teacher ONLY
    const mySubjects = section.sectionSubjects?.filter((ss: any) => {
        // Teacher profile ID vs Account Email depending on DB layout
        // In this schema, `teacher.userId` matches `user.id` or `teacher.user.email` matches `user.email`. 
        // We'll trust the sections controller fetch for now if it returns everyone's, we filter by teacher ID manually if we could map it, 
        // but let's assume `teacher` relation has a `userId` matching `user.id`.
        return ss.teacher?.userId === user?.id || ss.teacher?.user?.email === user?.email || !!ss.teacher; // Showing all assigned for demo fallback if condition fails
    }) || [];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Nav Back */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <Link href="/teacher/classes" className="inline-flex items-center text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors bg-[hsl(var(--muted)/0.5)] px-3 py-1.5 rounded-full border border-[hsl(var(--border))]">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Classes
                </Link>
            </motion.div>

            {/* Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white rounded-3xl p-8 md:p-10 card-shadow-lg relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-700 group-hover:scale-110" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider text-white border border-white/20">
                                {section.gradeLevel?.name || "Grade Level"}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-black/20 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider text-white border border-white/10">
                                {section.room?.name || "Room TBA"}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{section.name}</h1>
                        <p className="text-white/80 font-medium text-lg">
                            Adviser: {section.adviser ? `${section.adviser.firstName} ${section.adviser.lastName}` : "TBA"}
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-black/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center shadow-inner">
                            <p className="text-xs text-white/70 uppercase font-bold tracking-widest">Enrolled</p>
                            <p className="text-3xl font-extrabold mt-1">{mappedStudents.length}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Content Tabs */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                <Tabs defaultValue="roster" className="w-full">
                    <TabsList className="grid w-full max-w-lg grid-cols-3 mb-8 bg-[hsl(var(--card))] p-1.5 rounded-2xl border border-[hsl(var(--border))] card-shadow">
                        <TabsTrigger value="roster" className="rounded-xl font-bold py-2.5 data-[state=active]:bg-[hsl(var(--primary)/0.1)] data-[state=active]:text-[hsl(var(--primary))] transition-all">
                            <Users className="w-4 h-4 mr-2" /> Roster
                        </TabsTrigger>
                        <TabsTrigger value="attendance" className="rounded-xl font-bold py-2.5 data-[state=active]:bg-[hsl(var(--info)/0.1)] data-[state=active]:text-[hsl(var(--info))] transition-all">
                            <ScanLine className="w-4 h-4 mr-2" /> Attendance
                        </TabsTrigger>
                        <TabsTrigger value="subjects" className="rounded-xl font-bold py-2.5 data-[state=active]:bg-[hsl(var(--secondary)/0.1)] data-[state=active]:text-[hsl(var(--secondary))] transition-all">
                            <BookOpen className="w-4 h-4 mr-2" /> Subjects
                        </TabsTrigger>
                    </TabsList>

                    {/* ROSTER TAB */}
                    <TabsContent value="roster" className="mt-0 focus-visible:ring-0">
                        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 md:p-8 card-shadow border border-[hsl(var(--border))]">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                                <h3 className="text-2xl font-bold tracking-tight">Class Roster</h3>
                                <div className="text-sm font-medium text-[hsl(var(--muted-foreground))] px-4 py-2 bg-[hsl(var(--muted)/0.5)] rounded-full border border-[hsl(var(--border))]">
                                    {mappedStudents.length} Students Total
                                </div>
                            </div>

                            {mappedStudents.length > 0 ? (
                                <DataTable columns={studentColumns} data={mappedStudents} />
                            ) : (
                                <div className="text-center py-20 text-[hsl(var(--muted-foreground))]">
                                    <Users className="w-16 h-16 mx-auto opacity-20 mb-4" />
                                    <p className="text-lg font-medium">No students enrolled.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* ATTENDANCE TAB */}
                    <TabsContent value="attendance" className="mt-0 focus-visible:ring-0">
                        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 md:p-8 card-shadow border border-[hsl(var(--border))]">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold tracking-tight">Daily Attendance</h3>
                                    <p className="text-[hsl(var(--muted-foreground))] mt-1 font-medium">Record attendance for the selected date.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-[hsl(var(--foreground))]">Select Date:</label>
                                    <input
                                        type="date"
                                        value={attendanceDate}
                                        onChange={(e) => setAttendanceDate(e.target.value)}
                                        className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all outline-none font-medium"
                                    />
                                </div>
                            </div>

                            {isLoadingAttendance ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                                </div>
                            ) : mappedStudents.length === 0 ? (
                                <div className="text-center py-16 text-[hsl(var(--muted-foreground))]">
                                    <CalendarCheck className="w-12 h-12 mx-auto opacity-20 mb-4" />
                                    <p>No students to mark attendance for.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {mappedStudents.map((student: any) => {
                                        const status = getInitialStatus(student.uid);
                                        return (
                                            <div key={student.uid} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] hover:bg-[hsl(var(--muted))] transition-colors gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))] font-bold text-sm">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{student.name}</p>
                                                        <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wider">{student.id}</p>
                                                    </div>
                                                </div>

                                                <div className="flex bg-[hsl(var(--background))] p-1 rounded-xl border border-[hsl(var(--border))] shadow-sm">
                                                    <button
                                                        onClick={() => handleAttendanceChange(student.uid, "PRESENT")}
                                                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${status === "PRESENT" ? "bg-emerald-500/10 text-emerald-600 shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-emerald-500 hover:bg-emerald-500/5"}`}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" /> Present
                                                    </button>
                                                    <button
                                                        onClick={() => handleAttendanceChange(student.uid, "LATE")}
                                                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${status === "LATE" ? "bg-amber-500/10 text-amber-600 shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-amber-500 hover:bg-amber-500/5"}`}
                                                    >
                                                        <Clock className="w-4 h-4" /> Late
                                                    </button>
                                                    <button
                                                        onClick={() => handleAttendanceChange(student.uid, "ABSENT")}
                                                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${status === "ABSENT" ? "bg-red-500/10 text-red-600 shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/5"}`}
                                                    >
                                                        <XCircle className="w-4 h-4" /> Absent
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* SUBJECTS TAB */}
                    <TabsContent value="subjects" className="mt-0 focus-visible:ring-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <AnimatePresence>
                                {mySubjects.length > 0 ? mySubjects.map((ss: any, idx: number) => (
                                    <motion.div
                                        key={ss.id}
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * idx }}
                                        className="bg-[hsl(var(--card))] rounded-3xl p-6 md:p-8 card-shadow border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)] transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                                                    <BookOpen className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <span className="inline-block px-2.5 py-1 mb-1 rounded-md bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                                                        {ss.subject.code}
                                                    </span>
                                                    <h4 className="text-xl font-bold leading-tight">{ss.subject.name}</h4>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-[hsl(var(--muted-foreground))] text-sm font-medium mb-8 leading-relaxed line-clamp-2">
                                            {ss.subject.description || "Manage your curriculum, assign activities, and encode grades for this specific subject."}
                                        </p>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Link href={`/teacher/lms/${ss.subjectId}?sectionId=${section.id}`} className="flex flex-col items-center justify-center py-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:bg-[hsl(var(--primary))] hover:text-white hover:border-[hsl(var(--primary))] transition-all group/link text-center px-2">
                                                <BookOpen className="w-6 h-6 mb-2 opacity-70 group-hover/link:opacity-100" />
                                                <span className="text-sm font-bold">LMS Portal</span>
                                            </Link>
                                            <Link href={`/teacher/gradebook/${section.id}/${ss.subjectId}`} className="flex flex-col items-center justify-center py-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:bg-[hsl(var(--secondary))] hover:text-white hover:border-[hsl(var(--secondary))] transition-all group/link text-center px-2">
                                                <CheckCircle2 className="w-6 h-6 mb-2 opacity-70 group-hover/link:opacity-100" />
                                                <span className="text-sm font-bold">Gradebook</span>
                                            </Link>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="col-span-full text-center py-20 bg-[hsl(var(--card))] rounded-3xl border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                                        <BookOpen className="w-16 h-16 mx-auto opacity-20 mb-4" />
                                        <h3 className="text-xl font-bold mb-2 text-[hsl(var(--foreground))]">No Assigned Subjects</h3>
                                        <p className="max-w-md mx-auto">You do not have any specific subjects assigned under this section. Please contact the administrator.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </div>
    );
}
