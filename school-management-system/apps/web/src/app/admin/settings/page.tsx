import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h2 className="text-xl font-bold">Settings</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage system configuration</p>
            </div>

            {/* Academic Year */}
            <div className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))] space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">Academic Year & Grading Config</h3>
                        <p className="text-sm text-muted-foreground mt-1">Manage the underlying timeline for the school, including grading period weightages and active semesters.</p>
                    </div>
                    <Link href="/admin/settings/academic-years">
                        <Button>Configure Timeline</Button>
                    </Link>
                </div>
            </div>

            {/* System Settings */}
            <div className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))] space-y-4">
                <h3 className="font-bold">General Settings</h3>
                <div className="space-y-3">
                    {[
                        { label: "Allow Student Self-Enrollment", checked: true },
                        { label: "Enable Email Notifications", checked: true },
                        { label: "Enable Push Notifications", checked: false },
                        { label: "Maintenance Mode", checked: false },
                    ].map((setting, i) => (
                        <div key={i} className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium">{setting.label}</span>
                            <button
                                className={`w-11 h-6 rounded-full transition-colors relative ${setting.checked
                                    ? "bg-[hsl(var(--primary))]"
                                    : "bg-[hsl(var(--muted-foreground)/0.2)]"
                                    }`}
                            >
                                <div
                                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${setting.checked ? "translate-x-[22px]" : "translate-x-0.5"
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Account */}
            <div className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))] space-y-4">
                <h3 className="font-bold">Change Password</h3>
                <div className="space-y-3">
                    <input type="password" placeholder="Current Password" className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" />
                    <input type="password" placeholder="New Password" className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" />
                    <input type="password" placeholder="Confirm New Password" className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" />
                </div>
                <button className="px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-colors shadow-md shadow-[hsl(var(--primary)/0.25)]">
                    Update Password
                </button>
            </div>
        </div>
    );
}
