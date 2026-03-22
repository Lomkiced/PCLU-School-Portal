import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Settings,
    Building2,
    GraduationCap,
    BookOpen,
    Users,
    CalendarRange,
    ShieldCheck,
    BellRing,
    Palette
} from "lucide-react";

const settingModules = [
    {
        category: "School Structure",
        description: "Manage the core building blocks of your institution.",
        items: [
            {
                title: "Academic Structure",
                description: "Manage Academic Years, Grading Systems, and Term configurations.",
                icon: CalendarRange,
                href: "/admin/settings/academic-structure",
                color: "text-blue-600",
                bgColor: "bg-blue-500/10"
            },
            {
                title: "Curriculum Setup",
                description: "Establish Grade Levels and Sections for the school.",
                icon: BookOpen,
                href: "/admin/settings/curriculum",
                color: "text-emerald-600",
                bgColor: "bg-emerald-500/10"
            },
            {
                title: "Faculty Departments",
                description: "Create and organize Faculty Departments and heads.",
                icon: Building2,
                href: "/admin/settings/departments",
                color: "text-purple-600",
                bgColor: "bg-purple-500/10"
            }
        ]
    },
    {
        category: "System Administration",
        description: "Configure portal behavior, security, and integration.",
        items: [
            {
                title: "Security & Roles",
                description: "Manage administrators, staff roles, and permissions.",
                icon: ShieldCheck,
                href: "#", // Placeholder
                color: "text-red-600",
                bgColor: "bg-red-500/10"
            },
            {
                title: "Notifications",
                description: "Configure email, push notifications, and announcements.",
                icon: BellRing,
                href: "#", // Placeholder
                color: "text-amber-600",
                bgColor: "bg-amber-500/10"
            },
            {
                title: "Appearance",
                description: "Customize portal branding, logos, and color schemes.",
                icon: Palette,
                href: "#", // Placeholder
                color: "text-pink-600",
                bgColor: "bg-pink-500/10"
            }
        ]
    }
];

export default function AdminSettingsPage() {
    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                    Configure and customize your school management portal. As an administrator, you have full control over the structural and operational settings.
                </p>
            </div>

            {/* Modules Grid */}
            <div className="space-y-10">
                {settingModules.map((module, idx) => (
                    <div key={idx} className="space-y-4">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {module.category}
                            </h2>
                            <p className="text-sm text-muted-foreground">{module.description}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {module.items.map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <Link key={i} href={item.href}>
                                        <div className="group h-full bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-1 transition-all duration-300">
                                            <div className="flex flex-col h-full gap-4">
                                                <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                    <Icon className={`w-6 h-6 ${item.color}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Account Settings */}
            <div className="space-y-4 pt-6 border-t border-border">
                <div>
                    <h2 className="text-xl font-bold">Personal Account Settings</h2>
                    <p className="text-sm text-muted-foreground">Manage your own administrator credentials.</p>
                </div>
                <div className="bg-card rounded-2xl p-6 border border-border shadow-sm max-w-2xl">
                    <h3 className="font-bold mb-4">Change Password</h3>
                    <div className="space-y-3">
                        <input type="password" placeholder="Current Password" className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        <input type="password" placeholder="New Password" className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        <input type="password" placeholder="Confirm New Password" className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <button className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md shadow-primary/25">
                        Update Password
                    </button>
                </div>
            </div>
        </div>
    );
}
