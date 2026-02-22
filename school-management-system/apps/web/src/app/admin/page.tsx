"use client";

import { GraduationCap, Users, Calendar, DollarSign, MessageSquare, Megaphone, TrendingUp, Clock } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            {/* Greeting */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Welcome back! 👋</h2>
                    <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
                        Here&apos;s what&apos;s happening across the school today.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                    <Clock className="w-4 h-4" />
                    {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Students"
                    value="1,247"
                    change="+12%"
                    icon={<GraduationCap className="w-5 h-5" />}
                    color="var(--primary)"
                />
                <StatCard
                    label="Total Faculty"
                    value="86"
                    change="+3%"
                    icon={<Users className="w-5 h-5" />}
                    color="var(--secondary)"
                />
                <StatCard
                    label="Active Sections"
                    value="42"
                    change="+2"
                    icon={<Calendar className="w-5 h-5" />}
                    color="var(--info)"
                />
                <StatCard
                    label="Revenue (Month)"
                    value="₱2.4M"
                    change="+8%"
                    icon={<DollarSign className="w-5 h-5" />}
                    color="var(--success)"
                />
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold">Enrollment Overview</h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Monthly enrollment trends</p>
                        </div>
                        <div className="flex gap-1 p-1 bg-[hsl(var(--muted))] rounded-lg">
                            {["Week", "Month", "Year"].map((period) => (
                                <button
                                    key={period}
                                    className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors hover:bg-[hsl(var(--card))] data-[active=true]:bg-[hsl(var(--card))] data-[active=true]:shadow-sm"
                                    data-active={period === "Month"}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Chart placeholder with fake bars */}
                    <div className="flex items-end gap-3 h-48">
                        {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className="w-full rounded-lg transition-all duration-500 hover:opacity-80"
                                    style={{
                                        height: `${h}%`,
                                        background: `linear-gradient(to top, hsl(var(--primary)), hsl(var(--primary) / 0.6))`,
                                    }}
                                />
                                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))]">
                    <h3 className="font-bold mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                        {[
                            { icon: GraduationCap, label: "New Student", desc: "Register a student", color: "var(--primary)" },
                            { icon: Users, label: "Add Faculty", desc: "Create faculty account", color: "var(--secondary)" },
                            { icon: Megaphone, label: "Announcement", desc: "Post announcement", color: "var(--warning)" },
                            { icon: DollarSign, label: "Record Payment", desc: "Process a payment", color: "var(--success)" },
                            { icon: MessageSquare, label: "Send Message", desc: "Compose message", color: "var(--info)" },
                        ].map((action, i) => (
                            <button
                                key={i}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[hsl(var(--muted))] transition-all text-left group"
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                                    style={{
                                        background: `hsl(${action.color} / 0.12)`,
                                        color: `hsl(${action.color})`,
                                    }}
                                >
                                    <action.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{action.label}</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{action.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))]">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold">Recent Activity</h3>
                    <button className="text-xs text-[hsl(var(--primary))] font-semibold hover:underline">
                        View All
                    </button>
                </div>
                <div className="space-y-4">
                    {[
                        { action: "New student enrolled", detail: "Maria Santos — BSIT 2A", time: "2 min ago", color: "var(--primary)" },
                        { action: "Payment received", detail: "₱12,500 from Juan Dela Cruz", time: "15 min ago", color: "var(--success)" },
                        { action: "Grade submitted", detail: "Prof. Garcia — Math 101", time: "1 hour ago", color: "var(--info)" },
                        { action: "Announcement posted", detail: "Enrollment period extended", time: "3 hours ago", color: "var(--warning)" },
                        { action: "Faculty added", detail: "Dr. Reyes — Science Dept", time: "5 hours ago", color: "var(--secondary)" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: `hsl(${item.color})` }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{item.action}</p>
                                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{item.detail}</p>
                            </div>
                            <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">{item.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
