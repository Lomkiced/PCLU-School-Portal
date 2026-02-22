"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Plus, Pin, Trash2, Clock, Megaphone } from "lucide-react";

const mockAnnouncements = [
    { id: "1", title: "Enrollment Period Extended", body: "The enrollment period for AY 2026-2027 has been extended until March 31, 2026. All students are encouraged to complete their enrollment as soon as possible.", visibility: "ALL", author: "Admin Office", publishedAt: "2026-02-20", pinned: true },
    { id: "2", title: "Midterm Examination Schedule", body: "Midterm examinations will be held from March 10-14, 2025. Please check your respective timetables for the exact schedule.", visibility: "STUDENTS_ONLY", author: "Registrar", publishedAt: "2026-02-18", pinned: false },
    { id: "3", title: "Faculty Meeting", body: "All faculty members are required to attend the general assembly on March 5, 2026 at the AVR, 2:00 PM.", visibility: "TEACHERS_ONLY", author: "Admin Office", publishedAt: "2026-02-15", pinned: false },
    { id: "4", title: "Foundation Day Celebration", body: "Join us for the PCLU Foundation Day celebration on April 15, 2026. Various events and activities are planned.", visibility: "ALL", author: "Student Affairs", publishedAt: "2026-02-10", pinned: true },
    { id: "5", title: "Library Hours Update", body: "The library will now be open from 7:00 AM to 8:00 PM on weekdays. Weekend hours remain unchanged.", visibility: "ALL", author: "Library", publishedAt: "2026-02-05", pinned: false },
];

const visibilityColors: Record<string, "default" | "info" | "warning"> = {
    ALL: "default",
    STUDENTS_ONLY: "info",
    TEACHERS_ONLY: "warning",
};

export default function AnnouncementsPage() {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Announcements</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage school-wide announcements</p>
                </div>
                <Button size="sm" onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4" /> New Announcement
                </Button>
            </div>

            <div className="space-y-4">
                {mockAnnouncements.map((a) => (
                    <div
                        key={a.id}
                        className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))] hover:card-shadow-lg transition-all"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {a.pinned && (
                                        <Pin className="w-3.5 h-3.5 text-[hsl(var(--warning))] fill-[hsl(var(--warning))]" />
                                    )}
                                    <h3 className="font-bold text-base">{a.title}</h3>
                                    <Badge variant={visibilityColors[a.visibility]}>
                                        {a.visibility.replace("_", " ")}
                                    </Badge>
                                </div>
                                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed line-clamp-2">
                                    {a.body}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                                    <span className="font-medium">{a.author}</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {a.publishedAt}
                                    </span>
                                </div>
                            </div>
                            <button className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-[hsl(var(--muted-foreground))] hover:text-red-500 shrink-0">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Announcement" size="lg">
                <form className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <input className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" placeholder="Announcement title" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Content</label>
                        <textarea rows={5} className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-none" placeholder="Write announcement content..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Visibility</label>
                        <select className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]">
                            <option value="ALL">All Users</option>
                            <option value="STUDENTS_ONLY">Students Only</option>
                            <option value="TEACHERS_ONLY">Teachers Only</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit"><Megaphone className="w-4 h-4" /> Publish</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

