"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    RowSelectionState,
} from "@tanstack/react-table";

interface Student {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    enrollmentStatus: string;
}

export default function PromotionWizardPage() {
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [gradeLevels, setGradeLevels] = useState<any[]>([]);

    // Source State
    const [sourceAyId, setSourceAyId] = useState("");
    const [sourceGradeId, setSourceGradeId] = useState("");
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoadingSource, setIsLoadingSource] = useState(false);

    // Target State
    const [targetAyId, setTargetAyId] = useState("");
    const [targetGradeId, setTargetGradeId] = useState("");

    // Selection State
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [ayRes, glRes] = await Promise.all([
                api.get("/academic-years"),
                api.get("/grade-levels")
            ]);
            setAcademicYears(ayRes.data.data || []);
            setGradeLevels(glRes.data.data || []);

            // Auto-select active AY for source
            const activeAy = ayRes.data.data?.find((ay: any) => ay.isActive);
            if (activeAy) setSourceAyId(activeAy.id);
        } catch (error) {
            toast.error("Failed to load initial configuration data.");
        }
    };

    useEffect(() => {
        if (sourceGradeId && sourceAyId) {
            fetchSourceStudents();
        } else {
            setStudents([]);
            setRowSelection({});
        }
    }, [sourceGradeId, sourceAyId]);

    const fetchSourceStudents = async () => {
        setIsLoadingSource(true);
        try {
            const res = await api.get(`/students`, {
                params: { gradeLevelId: sourceGradeId, status: 'ACTIVE' }
            });
            // Some endpoints return nested data, adjusting to common pattern
            setStudents(res.data.data || res.data || []);
            setRowSelection({});
        } catch (error) {
            toast.error("Failed to fetch source students");
        } finally {
            setIsLoadingSource(false);
        }
    };

    // TanStack Table Configuration
    const columns = useMemo(() => [
        {
            id: 'select',
            header: ({ table }: any) => (
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                    checked={table.getIsAllRowsSelected()}
                    onChange={table.getToggleAllRowsSelectedHandler()}
                />
            ),
            cell: ({ row }: any) => (
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                />
            ),
        },
        {
            accessorKey: 'studentId',
            header: 'Student ID',
        },
        {
            accessorFn: (row: Student) => `${row.lastName}, ${row.firstName}`,
            id: 'name',
            header: 'Full Name',
            cell: (info: any) => <span className="font-medium">{info.getValue()}</span>
        },
        {
            accessorKey: 'enrollmentStatus',
            header: 'Current Status',
            cell: (info: any) => (
                <span className="bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full text-xs font-semibold">
                    {info.getValue() || 'ACTIVE'}
                </span>
            )
        }
    ], []);

    const table = useReactTable({
        data: students,
        columns,
        state: { rowSelection },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
    });

    const handlePromote = async () => {
        const selectedFlatRows = table.getSelectedRowModel().flatRows;
        const selectedIds = selectedFlatRows.map(row => row.original.id);

        if (selectedIds.length === 0) {
            toast.warning("Please select at least one student to promote.");
            return;
        }

        if (!targetAyId || !targetGradeId) {
            toast.error("Target Academic Year and Target Grade Level are required.");
            return;
        }

        if (sourceAyId === targetAyId) {
            toast.error("Source and Target Academic Years cannot be the same.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                studentIds: selectedIds,
                sourceAcademicYearId: sourceAyId,
                targetAcademicYearId: targetAyId,
                targetGradeLevelId: targetGradeId
            };
            await api.post('/enrollments/promote/batch', payload);
            toast.success(`Successfully promoted ${selectedIds.length} students!`);

            // Refresh table
            setRowSelection({});
            fetchSourceStudents();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to promote students. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <div>
                <h2 className="text-2xl font-bold">Academic Rollover Wizard</h2>
                <p className="text-[hsl(var(--muted-foreground))]">Securely evaluate and promote students to the next academic year.</p>
            </div>

            {/* Top Configuration Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SOURCE PARAMS */}
                <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[hsl(var(--muted))] text-sm flex items-center justify-center">1</span>
                        Source Class
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Source Academic Year</label>
                            <select
                                value={sourceAyId}
                                onChange={(e) => setSourceAyId(e.target.value)}
                                className="w-full p-2.5 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                            >
                                <option value="">Select Academic Year...</option>
                                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Source Grade Level</label>
                            <select
                                value={sourceGradeId}
                                onChange={(e) => setSourceGradeId(e.target.value)}
                                className="w-full p-2.5 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                            >
                                <option value="">Select Grade Level...</option>
                                {gradeLevels.map(gl => <option key={gl.id} value={gl.id}>{gl.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* TARGET PARAMS */}
                <div className="bg-[hsl(var(--primary)/0.02)] border border-[hsl(var(--primary)/0.2)] rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-4 text-[hsl(var(--primary))] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-sm flex items-center justify-center">2</span>
                        Target Destination
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Target Academic Year</label>
                            <select
                                value={targetAyId}
                                onChange={(e) => setTargetAyId(e.target.value)}
                                className="w-full p-2.5 bg-white border border-[hsl(var(--primary)/0.2)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                            >
                                <option value="">Select Target Year...</option>
                                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Target Grade Level</label>
                            <select
                                value={targetGradeId}
                                onChange={(e) => setTargetGradeId(e.target.value)}
                                className="w-full p-2.5 bg-white border border-[hsl(var(--primary)/0.2)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                            >
                                <option value="">Select Promotion Grade...</option>
                                {gradeLevels.map(gl => <option key={gl.id} value={gl.id}>{gl.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* TanStack Evaluation Table */}
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        Evaluation Roster
                        <span className="bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs px-2 py-0.5 rounded-full">{students.length} Total</span>
                    </h3>
                    <div className="text-sm text-[hsl(var(--muted-foreground))] font-medium">
                        {Object.keys(rowSelection).length} selected
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[hsl(var(--muted)/0.5)] border-b border-[hsl(var(--border))]">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id} className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-[hsl(var(--border))]">
                            {isLoadingSource ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--primary))] mx-auto mb-2" />
                                        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading students...</p>
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
                                        Select a Source Academic Year and Grade Level to evaluate students.
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className={`hover:bg-[hsl(var(--muted)/0.5)] transition-colors ${row.getIsSelected() ? 'bg-[hsl(var(--primary)/0.05)]' : ''}`}>
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="py-3 px-4 text-sm">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-64 right-0 p-4 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-[hsl(var(--primary))]" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">Ready to Promote?</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Double check your target destination parameters.</p>
                    </div>
                </div>

                <button
                    onClick={handlePromote}
                    disabled={Object.keys(rowSelection).length === 0 || isSubmitting}
                    className="flex items-center gap-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-8 py-3 rounded-xl text-sm font-bold hover:bg-[hsl(var(--primary-hover))] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[hsl(var(--primary)/0.25)] hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isSubmitting ? "Processing Rollover..." : `Promote ${Object.keys(rowSelection).length} Students`}
                </button>
            </div>
        </div>
    );
}
