"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ReceiptText, Loader2, ArrowLeft, Tags } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const paymentSchema = z.object({
    amountPaid: z.number().min(1, "Payment must be greater than 0"),
    method: z.string().min(1, "Payment Method is required"),
    referenceNumber: z.string().optional(),
});

const discountSchema = z.object({
    discountAmount: z.number().min(0, "Discount cannot be negative"),
    discountReason: z.string().min(1, "Discount reason is required"),
});

export default function StudentLedgerPage() {
    const params = useParams();
    const router = useRouter();
    const gradeId = params.gradeId as string;
    const studentId = params.studentId as string;

    const [invoices, setInvoices] = useState<any[]>([]);
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const paymentForm = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: { amountPaid: 0, method: "CASH", referenceNumber: "" }
    });

    const discountForm = useForm<z.infer<typeof discountSchema>>({
        resolver: zodResolver(discountSchema),
        defaultValues: { discountAmount: 0, discountReason: "" }
    });

    useEffect(() => {
        if (studentId) fetchInitialData();
    }, [studentId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [stuRes, invRes] = await Promise.all([
                api.get(`/students/${studentId}`),
                api.get(`/finance/invoices?studentId=${studentId}`)
            ]);
            setStudent(stuRes.data.data);
            setInvoices(invRes.data.data);
        } catch (error) {
            toast.error("Failed to load student ledger.");
            router.push(`/admin/finance/invoices/${gradeId}`);
        } finally {
            setLoading(false);
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

    const handleApplyDiscount = async (data: z.infer<typeof discountSchema>) => {
        if (!selectedInvoice) return;
        setIsSubmitting(true);
        try {
            await api.patch(`/finance/invoices/${selectedInvoice.id}/discount`, data);
            toast.success("Discount applied successfully!");
            setIsDiscountModalOpen(false);
            discountForm.reset();
            fetchInitialData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to apply discount.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openPaymentModal = (invoice: any) => {
        setSelectedInvoice(invoice);
        const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
        const adjustedTotal = invoice.totalAmount - (invoice.discountAmount || 0);

        paymentForm.reset({
            amountPaid: Math.max(0, adjustedTotal - totalPaid),
            method: "CASH",
            referenceNumber: ""
        });
        setIsPaymentModalOpen(true);
    };

    const openDiscountModal = (invoice: any) => {
        setSelectedInvoice(invoice);
        discountForm.reset({
            discountAmount: invoice.discountAmount || 0,
            discountReason: invoice.discountReason || ""
        });
        setIsDiscountModalOpen(true);
    };

    const columns = [
        {
            key: "feeStructure",
            label: "Fee Bundle",
            render: (row: any) => row.feeStructure.name
        },
        {
            key: "totalAmount",
            label: "Total Billed",
            sortable: true,
            render: (row: any) => <span className="font-medium">₱{row.totalAmount.toLocaleString()}</span>
        },
        {
            key: "discount",
            label: "Discount",
            render: (row: any) => (
                <div className="flex flex-col">
                    <span className="text-emerald-500">₱{(row.discountAmount || 0).toLocaleString()}</span>
                    {row.discountReason && <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{row.discountReason}</span>}
                </div>
            )
        },
        {
            key: "balance",
            label: "Balance",
            sortable: true,
            render: (row: any) => {
                const totalPaid = row.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
                const adjustedTotal = row.totalAmount - (row.discountAmount || 0);
                const balance = adjustedTotal - totalPaid;
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
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => openPaymentModal(row)}
                        disabled={row.status === "PAID"}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50
                        bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.2)]"
                    >
                        <ReceiptText className="w-4 h-4" />
                        Pay
                    </button>
                    <button
                        onClick={() => openDiscountModal(row)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors
                        bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-emerald-50 hover:text-emerald-600"
                    >
                        <Tags className="w-4 h-4" />
                        Discount
                    </button>
                </div>
            )
        }
    ];

    if (loading || !student) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        );
    }

    // Top Level Summary Stats
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalDiscounts = invoices.reduce((sum, inv) => sum + (inv.discountAmount || 0), 0);
    const totalPaidSum = invoices.reduce((sum, inv) => sum + inv.payments.reduce((pSum: number, p: any) => pSum + p.amountPaid, 0), 0);
    const overallBalance = totalInvoiced - totalDiscounts - totalPaidSum;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href={`/admin/finance/invoices/${gradeId}`} className="p-2 bg-[hsl(var(--muted))] rounded-lg hover:bg-[hsl(var(--primary)/0.1)] transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold">{student.firstName} {student.lastName}</h2>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">System ID: {student.studentId}</p>
                    </div>
                </div>
            </div>

            {/* Overall Ledger Snapshot Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[hsl(var(--card))] p-5 rounded-2xl border border-[hsl(var(--border))] card-shadow">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wider mb-1">Total Invoiced</p>
                    <h3 className="text-2xl font-bold">₱{totalInvoiced.toLocaleString()}</h3>
                </div>
                <div className="bg-[hsl(var(--card))] p-5 rounded-2xl border border-[hsl(var(--border))] card-shadow">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wider mb-1">Total Discounts</p>
                    <h3 className="text-2xl font-bold text-emerald-500">₱{totalDiscounts.toLocaleString()}</h3>
                </div>
                <div className="bg-[hsl(var(--card))] p-5 rounded-2xl border border-[hsl(var(--border))] card-shadow">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wider mb-1">Total Paid</p>
                    <h3 className="text-2xl font-bold text-blue-500">₱{totalPaidSum.toLocaleString()}</h3>
                </div>
                <div className={`p-5 rounded-2xl border card-shadow ${overallBalance > 0 ? "bg-[hsl(var(--destructive)/0.05)] border-[hsl(var(--destructive)/0.2)]" : "bg-[hsl(var(--success)/0.1)] border-[hsl(var(--success)/0.2)]"}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${overallBalance > 0 ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--success))]"}`}>
                        Outstanding Balance
                    </p>
                    <h3 className={`text-2xl font-bold ${overallBalance > 0 ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--success))]"}`}>
                        ₱{overallBalance.toLocaleString()}
                    </h3>
                </div>
            </div>

            <div className="bg-[hsl(var(--card))] rounded-2xl p-6 card-shadow border border-[hsl(var(--border))]">
                <DataTable
                    columns={columns}
                    data={invoices}
                    searchPlaceholder="Search individual invoices..."
                />
            </div>

            {/* Record Payment Modal */}
            <Modal open={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record Payment" maxWidth="max-w-md">
                {selectedInvoice && (
                    <form onSubmit={paymentForm.handleSubmit(handleRecordPayment)} className="space-y-4 py-2">
                        <div className="bg-[hsl(var(--muted)/0.5)] p-4 rounded-xl border border-[hsl(var(--border))] space-y-2 font-mono text-sm">
                            <div className="flex justify-between">
                                <span className="text-[hsl(var(--muted-foreground))]">Base Billed:</span>
                                <span>₱{selectedInvoice.totalAmount.toLocaleString()}</span>
                            </div>
                            {selectedInvoice.discountAmount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span className="">Discount ({selectedInvoice.discountReason}):</span>
                                    <span>-₱{selectedInvoice.discountAmount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-[hsl(var(--muted-foreground))]">Total Paid:</span>
                                <span>₱{selectedInvoice.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 border-t border-[hsl(var(--border))] text-[hsl(var(--destructive))]">
                                <span>Amount Due:</span>
                                <span>₱{(selectedInvoice.totalAmount - (selectedInvoice.discountAmount || 0) - selectedInvoice.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0)).toLocaleString()}</span>
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

            {/* Apply Discount Modal */}
            <Modal open={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} title="Apply Discount" maxWidth="max-w-md">
                {selectedInvoice && (
                    <form onSubmit={discountForm.handleSubmit(handleApplyDiscount)} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Discount Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]">₱</span>
                                <input
                                    type="number"
                                    {...discountForm.register("discountAmount", { valueAsNumber: true })}
                                    className="w-full pl-8 p-2.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                />
                            </div>
                            {discountForm.formState.errors.discountAmount && <p className="text-xs text-red-500">{discountForm.formState.errors.discountAmount.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason for Discount</label>
                            <input
                                {...discountForm.register("discountReason")}
                                placeholder="e.g., Scholar, Sibling Discount"
                                className="w-full p-2.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                            />
                            {discountForm.formState.errors.discountReason && <p className="text-xs text-red-500">{discountForm.formState.errors.discountReason.message}</p>}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
                            <button type="button" onClick={() => setIsDiscountModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[hsl(var(--muted))] transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-6 py-2 rounded-xl text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-colors disabled:opacity-50">
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Apply Discount
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
