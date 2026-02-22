"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    Calendar,
    DollarSign,
    MessageSquare,
    Megaphone,
    Settings,
    LogOut,
    ChevronLeft,
    Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Students", href: "/admin/students", icon: GraduationCap },
    { label: "Faculty", href: "/admin/faculty", icon: Users },
    { label: "Subjects", href: "/admin/subjects", icon: BookOpen },
    { label: "Timetable", href: "/admin/timetable", icon: Calendar },
    { label: "Finance", href: "/admin/finance", icon: DollarSign },
    { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
    { label: "Messages", href: "/admin/messages", icon: MessageSquare },
    { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, hydrate, logout } = useAuthStore();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    if (!isAuthenticated) return null;

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-foreground))]",
                    collapsed ? "w-[72px]" : "w-64",
                    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-sm">P</span>
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-sm tracking-tight truncate">
                            PCLU Admin
                        </span>
                    )}
                </div>

                {/* Nav Items */}
                <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
                    {adminNavItems.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/admin" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-[hsl(var(--sidebar-active))] text-white shadow-md shadow-[hsl(var(--primary)/0.3)]"
                                        : "text-[hsl(var(--sidebar-foreground)/0.7)] hover:bg-[hsl(var(--sidebar-hover))] hover:text-white"
                                )}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                {!collapsed && <span className="truncate">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="shrink-0 p-3 border-t border-white/10 space-y-1">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-[hsl(var(--sidebar-foreground)/0.7)] hover:bg-red-500/10 hover:text-red-400 transition-all"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>Logout</span>}
                    </button>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex items-center gap-3 px-3 py-2 rounded-xl text-sm w-full text-[hsl(var(--sidebar-foreground)/0.5)] hover:text-white transition-all"
                    >
                        <ChevronLeft
                            className={cn(
                                "w-5 h-5 shrink-0 transition-transform",
                                collapsed && "rotate-180"
                            )}
                        />
                        {!collapsed && <span>Collapse</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg font-bold capitalize">
                            {adminNavItems.find(
                                (i) =>
                                    pathname === i.href ||
                                    (i.href !== "/admin" && pathname.startsWith(i.href))
                            )?.label || "Dashboard"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold">{user?.email}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                Administrator
                            </p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-white font-semibold text-sm">
                            {user?.email?.[0]?.toUpperCase() || "A"}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}
