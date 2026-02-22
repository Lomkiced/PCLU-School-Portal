"use client";

import { Badge } from "@/components/ui/badge";

const subjects = [
    { code: "CS101", name: "Introduction to Programming", teacher: "Prof. Garcia", units: 3, schedule: "MWF 7:00-8:30", room: "Lab 1", grade: "1.25", status: "Passing" },
    { code: "IT202", name: "Data Structures & Algorithms", teacher: "Dr. Reyes", units: 3, schedule: "TTh 9:00-10:30", room: "Lab 2", grade: "1.50", status: "Passing" },
    { code: "MATH201", name: "Calculus II", teacher: "Prof. Santos", units: 5, schedule: "MWF 1:00-2:30", room: "Room 204", grade: "2.00", status: "Passing" },
    { code: "ENG102", name: "Technical Writing", teacher: "Prof. Torres", units: 3, schedule: "TTh 7:00-8:30", room: "Room 101", grade: "1.75", status: "Passing" },
    { code: "PE101", name: "Physical Fitness", teacher: "Coach Rivera", units: 2, schedule: "Sat 8:00-10:00", room: "Gym", grade: "1.00", status: "Passing" },
    { code: "NSTP1", name: "NSTP - CWTS", teacher: "Dr. Cruz", units: 3, schedule: "Fri 3:00-5:00", room: "AVR", grade: "INC", status: "Incomplete" },
];

export default function GradesPage() {
    const totalUnits = subjects.reduce((acc, s) => acc + s.units, 0);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">My Grades</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">AY 2025-2026, 2nd Semester</p>
            </div>

            {/* GWA Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 card-shadow border border-[hsl(var(--border))] text-center">
                    <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase">Current GWA</p>
                    <p className="text-3xl font-bold mt-1 gradient-text">1.45</p>
                    <p className="text-xs text-[hsl(var(--success))] font-semibold mt-1">Dean&apos;s List</p>
                </div>
                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 card-shadow border border-[hsl(var(--border))] text-center">
                    <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase">Total Units</p>
                    <p className="text-3xl font-bold mt-1">{totalUnits}</p>
                </div>
                <div className="bg-[hsl(var(--card))] rounded-2xl p-5 card-shadow border border-[hsl(var(--border))] text-center">
                    <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase">Standing</p>
                    <p className="text-3xl font-bold mt-1 text-[hsl(var(--success))]">✓</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Regular</p>
                </div>
            </div>

            {/* Grades Table */}
            <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] card-shadow overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[hsl(var(--border))]">
                            {["Code", "Subject", "Units", "Teacher", "Schedule", "Grade", "Status"].map((h) => (
                                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(var(--border))]">
                        {subjects.map((s) => (
                            <tr key={s.code} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                                <td className="px-5 py-4 text-sm font-mono font-semibold">{s.code}</td>
                                <td className="px-5 py-4 text-sm font-semibold">{s.name}</td>
                                <td className="px-5 py-4 text-sm text-center">{s.units}</td>
                                <td className="px-5 py-4 text-sm text-[hsl(var(--muted-foreground))]">{s.teacher}</td>
                                <td className="px-5 py-4 text-xs text-[hsl(var(--muted-foreground))]">{s.schedule}</td>
                                <td className="px-5 py-4 text-sm font-bold">{s.grade}</td>
                                <td className="px-5 py-4">
                                    <Badge variant={s.status === "Passing" ? "success" : "warning"}>{s.status}</Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
