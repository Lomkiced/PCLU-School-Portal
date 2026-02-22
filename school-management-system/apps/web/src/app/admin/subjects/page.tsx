"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Plus, Edit, Trash2 } from "lucide-react";

const mockSubjects = Array.from({ length: 25 }, (_, i) => ({
    id: `SUBJ-${String(i + 1).padStart(3, "0")}`,
    code: ["CS101", "MATH201", "ENG102", "SCI301", "BUS201", "PE101", "IT202", "NSTP1"][i % 8],
    name: ["Intro to Programming", "Calculus II", "Technical Writing", "Physics I", "Accounting Principles", "Physical Fitness", "Data Structures", "NSTP - CWTS"][i % 8],
    units: [3, 5, 3, 5, 3, 2, 3, 3][i % 8],
    department: ["Computer Science", "Mathematics", "Language", "Sciences", "Business", "PE", "Computer Science", "NSTP"][i % 8],
    prerequisites: i % 3 === 0 ? "None" : ["CS101", "MATH101", "ENG101"][i % 3],
    type: i % 4 === 0 ? "ELECTIVE" : "REQUIRED",
}));

export default function SubjectsPage() {
    const [showModal, setShowModal] = useState(false);

    const columns = [
        { key: "code", label: "Code", sortable: true },
        {
            key: "name",
            label: "Subject Name",
            sortable: true,
            render: (s: (typeof mockSubjects)[0]) => <span className="font-semibold">{s.name}</span>,
        },
        { key: "units", label: "Units", sortable: true },
        { key: "department", label: "Department", sortable: true },
        {
            key: "prerequisites",
            label: "Prerequisites",
            render: (s: (typeof mockSubjects)[0]) =>
                s.prerequisites === "None" ? (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">None</span>
                ) : (
                    <Badge variant="outline">{s.prerequisites}</Badge>
                ),
        },
        {
            key: "type",
            label: "Type",
            render: (s: (typeof mockSubjects)[0]) => (
                <Badge variant={s.type === "REQUIRED" ? "default" : "info"}>{s.type}</Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">Subject Management</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage curriculum subjects and prerequisites</p>
            </div>

            <DataTable
                columns={columns}
                data={mockSubjects}
                searchPlaceholder="Search by subject code or name..."
                toolbar={
                    <Button size="sm" onClick={() => setShowModal(true)}>
                        <Plus className="w-4 h-4" /> Add Subject
                    </Button>
                }
                actions={(subject) => (
                    <div className="flex items-center justify-end gap-1">
                        <button className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                            <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-[hsl(var(--muted-foreground))] hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            />

            <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Subject" size="md">
                <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Subject Code</label>
                            <input className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" placeholder="e.g. CS101" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Units</label>
                            <input type="number" className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" placeholder="3" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Subject Name</label>
                        <input className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" placeholder="Introduction to Programming" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Department</label>
                        <select className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]">
                            <option value="">Select department</option>
                            <option>Computer Science</option>
                            <option>Mathematics</option>
                            <option>Sciences</option>
                            <option>Language</option>
                            <option>Business</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit"><Plus className="w-4 h-4" /> Create Subject</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
