"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    Calendar,
    BookOpen,
    BarChart3,
    DollarSign,
    MessageSquare,
    Settings,
    LogOut,
    ChevronLeft,
    Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const studentNavItems = [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "Schedule", href: "/student/schedule", icon: Calendar },
    { label: "Subjects", href: "/student/subjects", icon: BookOpen },
    { label: "Grades", href: "/student/grades", icon: BarChart3 },
    { label: "Finances", href: "/student/finances", icon: DollarSign },
    { label: "Messages", href: "/student/messages", icon: MessageSquare },
    { label: "Settings", href: "/student/settings", icon: Settings },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, hydrate, logout } = useAuthStore();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => { hydrate(); }, [hydrate]);
    useEffect(() => { if (!isAuthenticated) router.push("/login"); }, [isAuthenticated, router]);

    if (!isAuthenticated) return null;

    return (
        <div className="flex h-screen overflow-hidden">
            {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300",
                "bg-gradient-to-b from-[hsl(234_35%_18%)] to-[hsl(234_40%_12%)] text-[hsl(220_20%_90%)]",
                collapsed ? "w-[72px]" : "w-64",
                mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-sm">S</span>
                    </div>
                    {!collapsed && <span className="font-bold text-sm tracking-tight truncate">Student Portal</span>}
                </div>

                <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
                    {studentNavItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/student" && pathname.startsWith(item.href));
                        return (
                            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                    isActive ? "bg-[hsl(var(--primary))] text-white shadow-md" : "text-white/60 hover:bg-white/10 hover:text-white"
                                )}>
                                <item.icon className="w-5 h-5 shrink-0" />
                                {!collapsed && <span className="truncate">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="shrink-0 p-3 border-t border-white/10">
                    <button onClick={() => { logout(); router.push("/login"); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all">
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 flex items-center justify-between px-6 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-[hsl(var(--muted))]"><Menu className="w-5 h-5" /></button>
                        <h1 className="text-lg font-bold capitalize">
                            {studentNavItems.find(i => pathname === i.href || (i.href !== "/student" && pathname.startsWith(i.href)))?.label || "Dashboard"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-white font-semibold text-sm">
                            {user?.email?.[0]?.toUpperCase() || "S"}
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}
