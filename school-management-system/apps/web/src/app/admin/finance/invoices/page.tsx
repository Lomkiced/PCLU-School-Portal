"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ReceiptText, Plus, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const generateInvoiceSchema = z.object({
    studentId: z.string().min(1, "Student is required"),
    feeStructureId: z.string().min(1, "Fee Structure is required"),
});

const paymentSchema = z.object({
    amountPaid: z.number().min(1, "Payment must be greater than 0"),
    method: z.string().min(1, "Payment Method is required"),
    referenceNumber: z.string().optional(),
});

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const generateForm = useForm<z.infer<typeof generateInvoiceSchema>>({
        resolver: zodResolver(generateInvoiceSchema),
        defaultValues: { studentId: "", feeStructureId: "" }
    });

    const paymentForm = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: { amountPaid: 0, method: "CASH", referenceNumber: "" }
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [invRes, stuRes, feeRes] = await Promise.all([
                api.get('/finance/invoices'),
                api.get('/students'),
                api.get('/finance/fee-structures')
            ]);
            setInvoices(invRes.data.data);
            setStudents(stuRes.data.data);
            setFeeStructures(feeRes.data.data);
        } catch (error) {
            toast.error("Failed to load invoice data.");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateInvoice = async (data: z.infer<typeof generateInvoiceSchema>) => {
        setIsSubmitting(true);
        try {
            await api.post('/finance/invoices/generate', data);
            toast.success("Invoice generated successfully!");
            setIsGenerateModalOpen(false);
            generateForm.reset();
            fetchInitialData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to generate invoice.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordPayment = async (data: z.infer<typeof paymentSchema>) => {
        if (!selectedInvoice) return;
        setIsSubmitting(true);
        try {
            await api.post('/finance/payments', {
                ...data,
                invoiceId: selectedInvoice.id
            });
            toast.success("Payment recorded successfully!");
            setIsPaymentModalOpen(false);
            paymentForm.reset();
            fetchInitialData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to record payment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openPaymentModal = (invoice: any) => {
        setSelectedInvoice(invoice);
        paymentForm.reset({
            amountPaid: invoice.totalAmount - invoice.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0),
            method: "CASH",
            referenceNumber: ""
        });
        setIsPaymentModalOpen(true);
    };

    const columns = [
        {
            key: "student",
            label: "Student",
            sortable: true,
            render: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold">{row.student.user.firstName} {row.student.user.lastName}</span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{row.student.studentId}</span>
                </div>
            )
        },
        {
            key: "feeStructure",
            label: "Fee Bundle",
            render: (row: any) => row.feeStructure.name
        },
        {
            key: "totalAmount",
            label: "Billed",
            sortable: true,
            render: (row: any) => <span className="font-medium text-[hsl(var(--primary))]">₱{row.totalAmount.toLocaleString()}</span>
        },
        {
            key: "balance",
            label: "Balance",
            sortable: true,
            render: (row: any) => {
                const totalPaid = row.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
                const balance = row.totalAmount - totalPaid;
                return (
                    <span className={`font-bold ${balance > 0 ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--success))]"}`}>
                        ₱{balance.toLocaleString()}
                    </span>
                );
            }
        },
        {
            key: "status",
            label: "Status",
            render: (row: any) => (
                <Badge variant={row.status === "PAID" ? "success" : row.status === "PARTIAL" ? "warning" : "destructive"}>
                    {row.status}
                </Badge>
            )
        },
        {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
                <button
                    onClick={() => openPaymentModal(row)}
                    disabled={row.status === "PAID"}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50
                    bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.2)]"
                >
                    <ReceiptText className="w-4 h-4" />
                    Pay
                </button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Ledger & Invoicing</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage student receivables and payments</p>
                </div>
                <button
                    onClick={() => setIsGenerateModalOpen(true)}
                    className="flex items-center gap-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-colors shadow-md shadow-[hsl(var(--primary)/0.25)]"
                >
                    <Plus className="w-4 h-4" />
                    Issue Invoice
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
                        data={invoices}
                        searchPlaceholder="Search invoices..."
                    />
                )}
            </div>

            {/* Generate Invoice Modal */}
            <Modal open={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} title="Issue Invoice" maxWidth="max-w-md">
                <form onSubmit={generateForm.handleSubmit(handleGenerateInvoice)} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Student</label>
                        <select
                            {...generateForm.register("studentId")}
                            className="w-full p-2.5 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                        >
                            <option value="">-- Choose Student --</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.user.firstName} {s.user.lastName} ({s.studentId})</option>
                            ))}
                        </select>
                        {generateForm.formState.errors.studentId && <p className="text-xs text-red-500">{generateForm.formState.errors.studentId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Fee Bundle</label>
                        <select
                            {...generateForm.register("feeStructureId")}
                            className="w-full p-2.5 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                        >
                            <option value="">-- Choose Bundle --</option>
                            {feeStructures.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                        {generateForm.formState.errors.feeStructureId && <p className="text-xs text-red-500">{generateForm.formState.errors.feeStructureId.message}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
                        <button type="button" onClick={() => setIsGenerateModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[hsl(var(--muted))] transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-6 py-2 rounded-xl text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-colors disabled:opacity-50">
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Issue
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Record Payment Modal */}
            <Modal open={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record Payment" maxWidth="max-w-md">
                {selectedInvoice && (
                    <form onSubmit={paymentForm.handleSubmit(handleRecordPayment)} className="space-y-4 py-2">

                        <div className="bg-[hsl(var(--muted)/0.5)] p-4 rounded-xl border border-[hsl(var(--border))] space-y-2 font-mono text-sm">
                            <div className="flex justify-between">
                                <span className="text-[hsl(var(--muted-foreground))]">Total Billed:</span>
                                <span>₱{selectedInvoice.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[hsl(var(--muted-foreground))]">Total Paid:</span>
                                <span>₱{selectedInvoice.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 border-t border-[hsl(var(--border))] text-[hsl(var(--destructive))]">
                                <span>Amount Due:</span>
                                <span>₱{(selectedInvoice.totalAmount - selectedInvoice.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0)).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Payment Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]">₱</span>
                                <input
                                    type="number"
                                    {...paymentForm.register("amountPaid", { valueAsNumber: true })}
                                    className="w-full pl-8 p-2.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                />
                            </div>
                            {paymentForm.formState.errors.amountPaid && <p className="text-xs text-red-500">{paymentForm.formState.errors.amountPaid.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Payment Method</label>
                            <select
                                {...paymentForm.register("method")}
                                className="w-full p-2.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                            >
                                <option value="CASH">Cash</option>
                                <option value="GCASH">GCash</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reference Number (Optional)</label>
                            <input
                                {...paymentForm.register("referenceNumber")}
                                placeholder="e.g. receipt or transaction ID"
                                className="w-full p-2.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
                            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[hsl(var(--muted))] transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-md shadow-emerald-500/20">
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Confirm Payment
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
