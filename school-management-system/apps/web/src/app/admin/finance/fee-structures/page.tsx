"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Plus, Trash2, Edit2, Loader2, ListPlus } from "lucide-react";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const feeItemSchema = z.object({
    name: z.string().min(1, "Item name is required"),
    amount: z.number().min(1, "Amount must be greater than 0"),
});

const feeStructureSchema = z.object({
    name: z.string().min(1, "Bundle name is required"),
    gradeLevelId: z.string().optional(),
    feeItems: z.array(feeItemSchema).min(1, "At least one fee item is required"),
});

type FeeStructureFormValues = z.infer<typeof feeStructureSchema>;

export default function FeeStructuresPage() {
    const [structures, setStructures] = useState<any[]>([]);
    const [gradeLevels, setGradeLevels] = useState<any[]>([]);
    const [activeAy, setActiveAy] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const form = useForm<FeeStructureFormValues>({
        resolver: zodResolver(feeStructureSchema),
        defaultValues: {
            name: "",
            gradeLevelId: "",
            feeItems: [{ name: "Tuition", amount: 0 }],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "feeItems"
    });

    const watchFeeItems = form.watch("feeItems");
    const totalAmount = watchFeeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Fetch Active Academic Year
            const ayRes = await api.get('/academic-years?isActive=true');
            const ay = ayRes.data.data[0];
            setActiveAy(ay);

            if (ay) {
                // Fetch Fee Structures
                const structuresRes = await api.get(`/finance/fee-structures?academicYearId=${ay.id}`);
                setStructures(structuresRes.data.data);
            }

            // Fetch Grade Levels for select dropdown
            const gradesRes = await api.get('/grade-levels');
            setGradeLevels(gradesRes.data.data);
        } catch (error) {
            toast.error("Failed to load fee structures.");
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (structure: any) => {
        setEditingId(structure.id);
        form.reset({
            name: structure.name,
            gradeLevelId: structure.gradeLevelId || "",
            feeItems: structure.feeItems.map((item: any) => ({ name: item.name, amount: item.amount }))
        });
        setIsAddModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this fee bundle?")) return;
        try {
            await api.delete(`/finance/fee-structures/${id}`);
            toast.success("Fee Bundle deleted successfully!");
            fetchInitialData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete fee structure.");
        }
    };

    const onSubmit = async (data: FeeStructureFormValues) => {
        if (!activeAy) {
            toast.error("No active academic year found.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                await api.put(`/finance/fee-structures/${editingId}`, {
                    ...data,
                    academicYearId: activeAy.id
                });
                toast.success("Fee Bundle updated successfully!");
            } else {
                await api.post('/finance/fee-structures', {
                    ...data,
                    academicYearId: activeAy.id
                });
                toast.success("Fee Bundle created successfully!");
            }
            setIsAddModalOpen(false);
            setEditingId(null);
            form.reset();
            fetchInitialData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save fee structure.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        { key: "name", label: "Bundle Name", sortable: true, render: (row: any) => <span className="font-semibold">{row.name}</span> },
        {
            key: "gradeLevel",
            label: "Grade Level",
            render: (row: any) => row.gradeLevel ? row.gradeLevel.name : <span className="text-gray-400">All Levels</span>
        },
        {
            key: "feeItems",
            label: "Items Count",
            render: (row: any) => (
                <div className="flex items-center gap-2">
                    <ListPlus className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span>{row.feeItems.length} items</span>
                </div>
            )
        },
        {
            key: "totalAmount",
            label: "Total Amount",
            sortable: true,
            render: (row: any) => {
                const total = row.feeItems.reduce((acc: number, curr: any) => acc + curr.amount, 0);
                return <span className="font-bold text-[hsl(var(--primary))]">₱{total.toLocaleString()}</span>;
            }
        },
        {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => openEditModal(row)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Bundle"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Bundle"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Fee Structures</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage dynamic bundled fee templates</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        form.reset({ name: "", gradeLevelId: "", feeItems: [{ name: "Tuition", amount: 0 }] });
                        setIsAddModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-colors shadow-md shadow-[hsl(var(--primary)/0.25)]"
                >
                    <Plus className="w-4 h-4" />
                    New Bundle
                </button>
            </div>

            <div className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))]">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--primary))]" />
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={structures}
                        searchPlaceholder="Search fee bundles..."
                    />
                )}
            </div>

            {/* Create / Edit Fee Structure Modal */}
            <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingId ? "Edit Fee Bundle" : "Create Fee Bundle"} maxWidth="max-w-xl">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Bundle Name</label>
                            <input
                                {...form.register("name")}
                                placeholder="e.g. Grade 7 Enrollment Fee"
                                className="w-full p-2.5 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                            />
                            {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Link to Grade Level (Optional)</label>
                            <select
                                {...form.register("gradeLevelId")}
                                className="w-full p-2.5 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                            >
                                <option value="">General (All Levels)</option>
                                {gradeLevels.map(grade => (
                                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dynamic Fee Items Array */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-[hsl(var(--border))] pb-2">
                            <h3 className="text-sm font-bold">Line Items</h3>
                            <button
                                type="button"
                                onClick={() => append({ name: "", amount: 0 })}
                                className="text-[hsl(var(--primary))] text-xs font-semibold hover:underline flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add Item
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-start gap-3 bg-[hsl(var(--muted)/0.5)] p-3 rounded-xl border border-[hsl(var(--border))]">
                                    <div className="flex-1 space-y-1">
                                        <input
                                            {...form.register(`feeItems.${index}.name`)}
                                            placeholder="Item Name (e.g. Laboratory Fee)"
                                            className="w-full p-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                        />
                                        {form.formState.errors.feeItems?.[index]?.name && (
                                            <p className="text-xs text-red-500">{form.formState.errors.feeItems[index]?.name?.message}</p>
                                        )}
                                    </div>
                                    <div className="w-1/3 space-y-1">
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-[hsl(var(--muted-foreground))]">₱</span>
                                            <input
                                                type="number"
                                                {...form.register(`feeItems.${index}.amount`, { valueAsNumber: true })}
                                                placeholder="0.00"
                                                className="w-full pl-7 p-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                            />
                                        </div>
                                        {form.formState.errors.feeItems?.[index]?.amount && (
                                            <p className="text-xs text-red-500">{form.formState.errors.feeItems[index]?.amount?.message}</p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="p-2.5 text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        disabled={fields.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Live Total Calculator */}
                        <div className="flex justify-between items-center bg-[hsl(var(--primary)/0.1)] p-4 rounded-xl border border-[hsl(var(--primary)/0.2)]">
                            <span className="font-semibold text-[hsl(var(--primary))]">Total Bundle Amount</span>
                            <span className="text-xl font-bold text-[hsl(var(--primary))]">₱{totalAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[hsl(var(--muted))] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-6 py-2 rounded-xl text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-colors disabled:opacity-50"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingId ? "Update Structure" : "Create Structure"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
