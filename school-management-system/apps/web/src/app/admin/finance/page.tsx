"use client";

import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

const mockFees = Array.from({ length: 40 }, (_, i) => ({
    id: `FEE-${String(i + 1).padStart(4, "0")}`,
    studentName: ["Maria Santos", "Juan Dela Cruz", "Ana Garcia", "Pedro Reyes", "Rosa Lopez"][i % 5],
    feeType: ["Tuition", "Miscellaneous", "Laboratory", "Library", "Athletic"][i % 5],
    amountDue: [15000, 3500, 2000, 500, 1000][i % 5],
    amountPaid: [15000, 2000, 2000, 0, 1000][i % 5],
    balance: [0, 1500, 0, 500, 0][i % 5],
    status: ["PAID", "PARTIAL", "PAID", "UNPAID", "PAID"][i % 5] as string,
    dueDate: "2026-03-15",
}));

export default function FinancePage() {
    const columns = [
        { key: "id", label: "Fee ID", sortable: true },
        {
            key: "studentName",
            label: "Student",
            sortable: true,
            render: (f: (typeof mockFees)[0]) => <span className="font-semibold">{f.studentName}</span>,
        },
        { key: "feeType", label: "Type", sortable: true },
        {
            key: "amountDue",
            label: "Amount Due",
            sortable: true,
            render: (f: (typeof mockFees)[0]) => `₱${f.amountDue.toLocaleString()}`,
        },
        {
            key: "amountPaid",
            label: "Paid",
            render: (f: (typeof mockFees)[0]) => `₱${f.amountPaid.toLocaleString()}`,
        },
        {
            key: "balance",
            label: "Balance",
            render: (f: (typeof mockFees)[0]) => (
                <span className={f.balance > 0 ? "text-[hsl(var(--destructive))] font-semibold" : ""}>
                    ₱{f.balance.toLocaleString()}
                </span>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (f: (typeof mockFees)[0]) => (
                <Badge
                    variant={f.status === "PAID" ? "success" : f.status === "PARTIAL" ? "warning" : "destructive"}
                >
                    {f.status}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">Finance & Billing</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage fees, payments, and financial reports</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Billed" value="₱18.6M" icon={<DollarSign className="w-5 h-5" />} color="var(--primary)" />
                <StatCard label="Total Collected" value="₱15.2M" change="+12%" icon={<TrendingUp className="w-5 h-5" />} color="var(--success)" />
                <StatCard label="Outstanding" value="₱3.4M" icon={<AlertCircle className="w-5 h-5" />} color="var(--warning)" />
                <StatCard label="Collection Rate" value="81.7%" icon={<CheckCircle className="w-5 h-5" />} color="var(--info)" />
            </div>

            <DataTable columns={columns} data={mockFees} searchPlaceholder="Search by student or fee ID..." />
        </div>
    );
}
