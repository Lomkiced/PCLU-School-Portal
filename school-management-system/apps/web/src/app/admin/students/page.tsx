"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Plus, Eye, Edit, Trash2, Download } from "lucide-react";

// Mock data
const mockStudents = Array.from({ length: 50 }, (_, i) => ({
    id: `STU-${String(i + 1).padStart(4, "0")}`,
    firstName: ["Maria", "Juan", "Ana", "Pedro", "Rosa", "Carlos", "Sofia", "Miguel", "Elena", "Luis"][i % 10],
    lastName: ["Santos", "Dela Cruz", "Garcia", "Reyes", "Lopez", "Torres", "Rivera", "Gonzales", "Ramos", "Cruz"][i % 10],
    email: `student${i + 1}@pclu.edu.ph`,
    gradeLevel: ["Grade 11", "Grade 12", "1st Year", "2nd Year", "3rd Year", "4th Year"][i % 6],
    section: ["Section A", "Section B", "Section C"][i % 3],
    status: ["ACTIVE", "ACTIVE", "ACTIVE", "INACTIVE", "ACTIVE"][i % 5] as "ACTIVE" | "INACTIVE",
}));

export default function StudentsPage() {
    const [showModal, setShowModal] = useState(false);

    const columns = [
        { key: "id", label: "Student ID", sortable: true },
        {
            key: "name",
            label: "Name",
            sortable: true,
            render: (s: (typeof mockStudents)[0]) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] flex items-center justify-center text-xs font-bold">
                        {s.firstName[0]}{s.lastName[0]}
                    </div>
                    <div>
                        <p className="font-semibold">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.email}</p>
                    </div>
                </div>
            ),
        },
        { key: "gradeLevel", label: "Grade / Year", sortable: true },
        { key: "section", label: "Section", sortable: true },
        {
            key: "status",
            label: "Status",
            render: (s: (typeof mockStudents)[0]) => (
                <Badge variant={s.status === "ACTIVE" ? "success" : "destructive"}>
                    {s.status}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Student Management</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Manage all enrolled students
                    </p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={mockStudents}
                searchPlaceholder="Search students by name, ID, or email..."
                toolbar={
                    <>
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" /> Export
                        </Button>
                        <Button size="sm" onClick={() => setShowModal(true)}>
                            <Plus className="w-4 h-4" /> Add Student
                        </Button>
                    </>
                }
                actions={(student) => (
                    <div className="flex items-center justify-end gap-1">
                        <button className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                            <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                            <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-[hsl(var(--muted-foreground))] hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            />

            {/* Add Student Modal */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title="Add New Student"
                description="Fill in the student details to create a new account."
                size="lg"
            >
                <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">First Name</label>
                            <input className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" placeholder="Enter first name" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Last Name</label>
                            <input className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" placeholder="Enter last name" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <input type="email" className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" placeholder="student@pclu.edu.ph" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Grade / Year Level</label>
                            <select className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]">
                                <option value="">Select level</option>
                                <option>Grade 11</option>
                                <option>Grade 12</option>
                                <option>1st Year</option>
                                <option>2nd Year</option>
                                <option>3rd Year</option>
                                <option>4th Year</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Section</label>
                            <select className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]">
                                <option value="">Select section</option>
                                <option>Section A</option>
                                <option>Section B</option>
                                <option>Section C</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            <Plus className="w-4 h-4" /> Create Student
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
