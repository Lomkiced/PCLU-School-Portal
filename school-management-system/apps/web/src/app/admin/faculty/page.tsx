"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";

const mockFaculty = Array.from({ length: 30 }, (_, i) => ({
    id: `FAC-${String(i + 1).padStart(4, "0")}`,
    firstName: ["Dr. Carlos", "Prof. Ana", "Dr. Miguel", "Prof. Rosa", "Dr. Elena", "Prof. Pedro", "Dr. Sofia", "Prof. Luis"][i % 8],
    lastName: ["Garcia", "Santos", "Reyes", "Torres", "Rivera", "Cruz", "Lopez", "Gonzales"][i % 8],
    email: `faculty${i + 1}@pclu.edu.ph`,
    department: ["Computer Science", "Education", "Engineering", "Business Admin", "Sciences"][i % 5],
    specialization: ["Software Engineering", "Curriculum Design", "Civil Eng", "Marketing", "Biology"][i % 5],
    status: i % 7 === 0 ? "ON_LEAVE" : "ACTIVE",
    advisorySection: i % 3 === 0 ? `Section ${String.fromCharCode(65 + (i % 3))}` : null,
}));

export default function FacultyPage() {
    const [showModal, setShowModal] = useState(false);

    const columns = [
        { key: "id", label: "Faculty ID", sortable: true },
        {
            key: "name",
            label: "Name",
            sortable: true,
            render: (f: (typeof mockFaculty)[0]) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--secondary)/0.1)] text-[hsl(var(--secondary))] flex items-center justify-center text-xs font-bold">
                        {f.firstName.split(" ").pop()?.[0]}{f.lastName[0]}
                    </div>
                    <div>
                        <p className="font-semibold">{f.firstName} {f.lastName}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{f.email}</p>
                    </div>
                </div>
            ),
        },
        { key: "department", label: "Department", sortable: true },
        { key: "specialization", label: "Specialization" },
        {
            key: "advisorySection",
            label: "Advisory",
            render: (f: (typeof mockFaculty)[0]) =>
                f.advisorySection ? (
                    <Badge variant="info">{f.advisorySection}</Badge>
                ) : (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">None</span>
                ),
        },
        {
            key: "status",
            label: "Status",
            render: (f: (typeof mockFaculty)[0]) => (
                <Badge variant={f.status === "ACTIVE" ? "success" : "warning"}>
                    {f.status.replace("_", " ")}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">Faculty Management</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage teachers and staff members</p>
            </div>

            <DataTable
                columns={columns}
                data={mockFaculty}
                searchPlaceholder="Search by name, department, or ID..."
                toolbar={
                    <Button size="sm" onClick={() => setShowModal(true)}>
                        <Plus className="w-4 h-4" /> Add Faculty
                    </Button>
                }
                actions={(faculty) => (
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

            <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Faculty Member" size="lg">
                <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">First Name</label>
                            <input className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Last Name</label>
                            <input className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <input type="email" className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Department</label>
                            <select className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]">
                                <option value="">Select department</option>
                                <option>Computer Science</option>
                                <option>Education</option>
                                <option>Engineering</option>
                                <option>Business Admin</option>
                                <option>Sciences</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Specialization</label>
                            <input className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit"><Plus className="w-4 h-4" /> Create Faculty</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
