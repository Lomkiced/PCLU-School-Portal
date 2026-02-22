"use client";

import { Calendar, BookOpen, BarChart3, DollarSign, Clock, Bell } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";

export default function StudentDashboard() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Welcome, Maria! 🎓</h2>
                    <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
                        BSIT 2A — AY 2025-2026, 2nd Semester
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                    <Clock className="w-4 h-4" />
                    {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Enrolled Subjects" value="6" icon={<BookOpen className="w-5 h-5" />} color="var(--primary)" />
                <StatCard label="Current GWA" value="1.45" icon={<BarChart3 className="w-5 h-5" />} color="var(--success)" subtitle="Dean's List!" />
                <StatCard label="Attendance" value="95%" icon={<Calendar className="w-5 h-5" />} color="var(--info)" change="+1%" />
                <StatCard label="Balance" value="₱2,500" icon={<DollarSign className="w-5 h-5" />} color="var(--warning)" subtitle="Due: Mar 15" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Today's Classes */}
                <div className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))]">
                    <h3 className="font-bold mb-4">Today&apos;s Classes</h3>
                    <div className="space-y-3">
                        {[
                            { time: "7:00 - 8:30", subject: "CS101 - Intro to Programming", room: "Lab 1", teacher: "Prof. Garcia", status: "Done" },
                            { time: "9:00 - 10:30", subject: "IT202 - Data Structures", room: "Lab 2", teacher: "Dr. Reyes", status: "Now" },
                            { time: "1:00 - 2:30", subject: "MATH201 - Calculus II", room: "Room 204", teacher: "Prof. Santos", status: "Later" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                                <div className="text-xs font-mono text-[hsl(var(--muted-foreground))] w-24 shrink-0">{item.time}</div>
                                <div className={`w-1 h-10 rounded-full shrink-0 ${item.status === "Done" ? "bg-[hsl(var(--success))]" : item.status === "Now" ? "bg-[hsl(var(--primary))] animate-pulse" : "bg-[hsl(var(--muted-foreground)/0.3)]"}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{item.subject}</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.teacher} • {item.room}</p>
                                </div>
                                <Badge variant={item.status === "Done" ? "success" : item.status === "Now" ? "default" : "outline"}>
                                    {item.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Deadlines */}
                <div className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))]">
                    <h3 className="font-bold mb-4">Upcoming Deadlines</h3>
                    <div className="space-y-3">
                        {[
                            { title: "Quiz 3 - Programming", subject: "CS101", due: "Tomorrow, 11:59 PM", urgent: true },
                            { title: "Activity 5 - Arrays", subject: "IT202", due: "Mar 5, 11:59 PM", urgent: false },
                            { title: "Essay - Data Ethics", subject: "CS101", due: "Mar 8, 5:00 PM", urgent: false },
                            { title: "Problem Set 4", subject: "MATH201", due: "Mar 10, 11:59 PM", urgent: false },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                                <div className="flex items-center gap-3">
                                    {item.urgent && <Bell className="w-4 h-4 text-[hsl(var(--destructive))] animate-bounce" />}
                                    <div>
                                        <p className="text-sm font-semibold">{item.title}</p>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.subject}</p>
                                    </div>
                                </div>
                                <Badge variant={item.urgent ? "destructive" : "outline"}>{item.due}</Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Announcements */}
            <div className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))]">
                <h3 className="font-bold mb-4">Recent Announcements</h3>
                <div className="space-y-3">
                    {[
                        { title: "Enrollment Period Extended", body: "Extended until March 31, 2026.", time: "2 days ago" },
                        { title: "Foundation Day Celebration", body: "Join us on April 15, 2026!", time: "5 days ago" },
                    ].map((a, i) => (
                        <div key={i} className="p-4 rounded-xl bg-[hsl(var(--muted)/0.5)] hover:bg-[hsl(var(--muted))] transition-colors">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-bold">{a.title}</p>
                                <span className="text-xs text-[hsl(var(--muted-foreground))]">{a.time}</span>
                            </div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{a.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
