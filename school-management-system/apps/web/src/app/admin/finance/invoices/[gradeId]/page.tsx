"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Plus, Loader2, ArrowLeft, Eye } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const bulkInvoiceSchema = z.object({
    feeStructureId: z.string().min(1, "Fee Structure is required"),
});

export default function GradeLevelLedgerPage() {
    const params = useParams();
    const router = useRouter();
    const gradeId = params.gradeId as string;

    const [students, setStudents] = useState<any[]>([]);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [gradeLevel, setGradeLevel] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof bulkInvoiceSchema>>({
        resolver: zodResolver(bulkInvoiceSchema),
        defaultValues: { feeStructureId: "" }
    });

    const defaultBundle = gradeLevel?.feeStructures?.[0];

    useEffect(() => {
        if (gradeId) fetchInitialData();
    }, [gradeId]);

    useEffect(() => {
        if (defaultBundle && isBulkModalOpen) {
            form.setValue("feeStructureId", defaultBundle.id);
        }
    }, [defaultBundle, isBulkModalOpen, form]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [gradeRes, ledgersRes, feesRes] = await Promise.all([
                api.get(`/grade-levels/${gradeId}`),
                api.get(`/finance/invoices/ledgers/${gradeId}`),
                api.get(`/finance/fee-structures`)
            ]);

            setGradeLevel(gradeRes.data.data);
            setStudents(ledgersRes.data.data);
            setFeeStructures(feesRes.data.data);
        } catch (error) {
            toast.error("Failed to load ledgers or grade data.");
            router.push('/admin/finance/invoices');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkIssue = async (data: z.infer<typeof bulkInvoiceSchema>) => {
        setIsSubmitting(true);
        try {
            const res = await api.post('/finance/invoices/batch', {
                gradeLevelId: gradeId,
                feeStructureId: data.feeStructureId
            });
            toast.success(res.data.message || "Bulk Invoices issued successfully!");
            setIsBulkModalOpen(false);
            form.reset();
            fetchInitialData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to generate bulk invoices.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        {
            key: "student",
            label: "Student",
            sortable: true,
            render: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold">{row.name}</span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{row.systemId}</span>
                </div>
            )
        },
        {
            key: "totalInvoiced",
            label: "Total Billed",
            sortable: true,
            render: (row: any) => <span className="text-[hsl(var(--muted-foreground))]">₱{row.totalInvoiced.toLocaleString()}</span>
        },
        {
            key: "totalDiscounts",
            label: "Discounts",
            render: (row: any) => <span className="text-emerald-500">₱{row.totalDiscounts.toLocaleString()}</span>
        },
        {
            key: "totalPaid",
            label: "Total Paid",
            render: (row: any) => <span className="text-blue-500">₱{row.totalPaid.toLocaleString()}</span>
        },
        {
            key: "outstandingBalance",
            label: "Outstanding Balance",
            sortable: true,
            render: (row: any) => (
                <span className={`font-bold ${row.outstandingBalance > 0 ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--success))]"}`}>
                    ₱{row.outstandingBalance.toLocaleString()}
                </span>
            )
        },
        {
            key: "actions",
            label: "Action",
            render: (row: any) => (
                <Link
                    href={`/admin/finance/invoices/${gradeId}/${row.studentId}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors
                    bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.2)]"
                >
                    <Eye className="w-4 h-4" />
                    Ledger
                </Link>
            )
        }
    ];

    if (loading || !gradeLevel) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/finance/invoices" className="p-2 bg-[hsl(var(--muted))] rounded-lg hover:bg-[hsl(var(--primary)/0.1)] transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-xl font-bold">{gradeLevel.name} Ledgers</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Batch processing and student overview</p>
                </div>
                <div className="ml-auto flex gap-3">
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="flex items-center gap-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-colors shadow-md shadow-[hsl(var(--primary)/0.25)]"
                    >
                        <Plus className="w-4 h-4" />
                        Bulk Issue Grade-wide Invoice
                    </button>
                </div>
            </div>

            <div className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))]">
                <DataTable
                    columns={columns}
                    data={students}
                    searchPlaceholder="Search student ledgers..."
                />
            </div>

            {/* Bulk Issue Modal */}
            <Modal open={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Bulk Issue Invoices" maxWidth="max-w-md">
                <form onSubmit={form.handleSubmit(handleBulkIssue)} className="space-y-4 py-2">
                    <div className="bg-[hsl(var(--warning)/0.1)] p-4 rounded-xl border border-[hsl(var(--warning)/0.2)] text-[hsl(var(--warning))] text-sm">
                        You are about to issue identical fee structures to <strong>every currently enrolled student</strong> in {gradeLevel.name}. The system will skip students who already have this specific bundle.
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Fee Bundle to Apply</label>
                        {defaultBundle ? (
                            <div className="p-3 bg-[hsl(var(--primary)/0.05)] border border-[hsl(var(--primary)/0.2)] rounded-xl text-sm font-medium">
                                <span className="text-[hsl(var(--primary))] block mb-1">Auto-locked to the default grade bundle:</span>
                                <span>{defaultBundle.name} (₱{(defaultBundle.feeItems || []).reduce((acc: number, curr: any) => acc + curr.amount, 0).toLocaleString()})</span>
                            </div>
                        ) : (
                            <>
                                <select
                                    disabled
                                    {...form.register("feeStructureId")}
                                    className="w-full p-2.5 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl text-sm opacity-50 cursor-not-allowed"
                                >
                                    <option value="">-- No Default Bundle Found --</option>
                                </select>
                                <p className="text-xs text-[hsl(var(--destructive))] font-medium mt-2">
                                    No default bundle configured for this grade level. Please create one in Fee Structures.
                                </p>
                            </>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
                        <button type="button" onClick={() => setIsBulkModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[hsl(var(--muted))] transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting || !defaultBundle} className="flex items-center gap-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-6 py-2 rounded-xl text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-colors disabled:opacity-50">
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Mass Generate
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
