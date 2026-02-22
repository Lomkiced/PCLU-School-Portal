"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const timeSlots = ["7:00", "8:00", "9:00", "10:00", "11:00", "12:00", "1:00", "2:00", "3:00", "4:00", "5:00"];

const mockSchedule: Record<string, Record<string, { subject: string; section: string; room: string; color: string } | null>> = {
    Monday: { "7:00": { subject: "CS101", section: "BSIT-2A", room: "Lab 1", color: "var(--primary)" }, "8:00": { subject: "CS101", section: "BSIT-2A", room: "Lab 1", color: "var(--primary)" }, "9:00": null, "10:00": { subject: "MATH201", section: "BSIT-1B", room: "Room 204", color: "var(--secondary)" }, "11:00": { subject: "MATH201", section: "BSIT-1B", room: "Room 204", color: "var(--secondary)" } },
    Tuesday: { "7:00": null, "8:00": { subject: "ENG102", section: "BSBA-1A", room: "Room 101", color: "var(--info)" }, "9:00": { subject: "ENG102", section: "BSBA-1A", room: "Room 101", color: "var(--info)" }, "10:00": null, "11:00": { subject: "PE101", section: "All", room: "Gym", color: "var(--success)" } },
    Wednesday: { "7:00": { subject: "IT202", section: "BSIT-3A", room: "Lab 2", color: "var(--warning)" }, "8:00": { subject: "IT202", section: "BSIT-3A", room: "Lab 2", color: "var(--warning)" }, "9:00": { subject: "IT202", section: "BSIT-3A", room: "Lab 2", color: "var(--warning)" }, "10:00": null, "11:00": null },
    Thursday: { "7:00": null, "8:00": { subject: "SCI301", section: "BSIT-2B", room: "Sci Lab", color: "var(--destructive)" }, "9:00": { subject: "SCI301", section: "BSIT-2B", room: "Sci Lab", color: "var(--destructive)" }, "10:00": { subject: "BUS201", section: "BSBA-2A", room: "Room 301", color: "172 66% 50%" }, "11:00": null },
    Friday: { "7:00": { subject: "CS101", section: "BSIT-2A", room: "Lab 1", color: "var(--primary)" }, "8:00": null, "9:00": { subject: "NSTP1", section: "All-1st", room: "AVR", color: "var(--info)" }, "10:00": { subject: "NSTP1", section: "All-1st", room: "AVR", color: "var(--info)" }, "11:00": null },
    Saturday: {},
};

export default function TimetablePage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">Timetable</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Master schedule — AY 2025-2026, 2nd Semester
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select className="px-4 py-2 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm">
                        <option>All Sections</option>
                        <option>BSIT-2A</option>
                        <option>BSIT-2B</option>
                        <option>BSBA-1A</option>
                    </select>
                    <Button variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4" /> Generate
                    </Button>
                </div>
            </div>

            {/* Timetable Grid */}
            <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] card-shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-[hsl(var(--border))]">
                                <th className="w-20 px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-left">
                                    Time
                                </th>
                                {days.map((day) => (
                                    <th
                                        key={day}
                                        className="px-3 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-center"
                                    >
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[hsl(var(--border))]">
                            {timeSlots.map((time) => (
                                <tr key={time} className="h-16">
                                    <td className="px-4 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] border-r border-[hsl(var(--border))]">
                                        {time}
                                    </td>
                                    {days.map((day) => {
                                        const slot = mockSchedule[day]?.[time];
                                        return (
                                            <td key={day} className="px-1 py-1 text-center">
                                                {slot && (
                                                    <div
                                                        className="rounded-lg px-2 py-1.5 text-white text-[10px] leading-tight"
                                                        style={{ background: `hsl(${slot.color})` }}
                                                    >
                                                        <p className="font-bold">{slot.subject}</p>
                                                        <p className="opacity-80">{slot.section}</p>
                                                        <p className="opacity-60">{slot.room}</p>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
