"use client";

import { GraduationCap, BookOpen, ClipboardCheck, ScanLine, Clock } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

export default function TeacherDashboard() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Good Morning, Professor! 📖</h2>
                    <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
                        Your teaching overview for today.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                    <Clock className="w-4 h-4" />
                    {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="My Classes" value="5" icon={<GraduationCap className="w-5 h-5" />} color="var(--secondary)" subtitle="Section advisory: BSIT-2A" />
                <StatCard label="Active Subjects" value="4" icon={<BookOpen className="w-5 h-5" />} color="var(--primary)" />
                <StatCard label="Pending Grades" value="12" icon={<ClipboardCheck className="w-5 h-5" />} color="var(--warning)" subtitle="3 submissions need review" />
                <StatCard label="Attendance Today" value="87%" icon={<ScanLine className="w-5 h-5" />} color="var(--success)" change="+2%" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Today's Schedule */}
                <div className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))]">
                    <h3 className="font-bold mb-4">Today&apos;s Schedule</h3>
                    <div className="space-y-3">
                        {[
                            { time: "7:00 - 8:30", subject: "CS101 - Intro to Programming", section: "BSIT-2A", room: "Lab 1", status: "Completed" },
                            { time: "9:00 - 10:30", subject: "IT202 - Data Structures", section: "BSIT-3A", room: "Lab 2", status: "In Progress" },
                            { time: "1:00 - 2:30", subject: "CS101 - Intro to Programming", section: "BSIT-2B", room: "Lab 1", status: "Upcoming" },
                            { time: "3:00 - 4:30", subject: "MATH201 - Calculus II", section: "BSIT-1B", room: "Room 204", status: "Upcoming" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                                <div className="text-xs font-mono text-[hsl(var(--muted-foreground))] w-24 shrink-0">{item.time}</div>
                                <div className={`w-1 h-10 rounded-full shrink-0 ${item.status === "Completed" ? "bg-[hsl(var(--success))]" : item.status === "In Progress" ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--muted-foreground)/0.3)]"}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{item.subject}</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.section} • {item.room}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Submissions */}
                <div className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))]">
                    <h3 className="font-bold mb-4">Recent Submissions</h3>
                    <div className="space-y-3">
                        {[
                            { student: "Maria Santos", activity: "Quiz 3 - Programming", score: "92/100", time: "2h ago" },
                            { student: "Juan Dela Cruz", activity: "Activity 5 - Arrays", score: "Pending", time: "3h ago" },
                            { student: "Ana Garcia", activity: "Quiz 3 - Programming", score: "88/100", time: "4h ago" },
                            { student: "Pedro Reyes", activity: "Activity 5 - Arrays", score: "Pending", time: "5h ago" },
                            { student: "Rosa Lopez", activity: "Essay - Data Ethics", score: "AI Grading", time: "6h ago" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                                <div>
                                    <p className="text-sm font-semibold">{item.student}</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.activity}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-semibold ${item.score === "Pending" ? "text-[hsl(var(--warning))]" : item.score === "AI Grading" ? "text-[hsl(var(--info))]" : "text-[hsl(var(--success))]"}`}>
                                        {item.score}
                                    </p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
