"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Loader2, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function InvoicesHubPage() {
    const [gradeLevels, setGradeLevels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const res = await api.get('/grade-levels');
                setGradeLevels(res.data.data);
            } catch (error) {
                toast.error("Failed to load grade levels.");
            } finally {
                setLoading(false);
            }
        };
        fetchGrades();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">Ledger & Invoicing Hub</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Select a Grade Level to manage student ledgers, apply discounts, and issue bulk invoices.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gradeLevels.map((grade) => (
                    <Link href={`/admin/finance/invoices/${grade.id}`} key={grade.id}>
                        <div className="group relative bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] transition-all duration-300 card-shadow hover:shadow-lg hover:shadow-[hsl(var(--primary)/0.15)] flex flex-col justify-between h-full cursor-pointer overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--primary)/0.05)] rounded-bl-full -z-10 transition-transform group-hover:scale-110" />

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold group-hover:text-[hsl(var(--primary))] transition-colors">
                                        {grade.name}
                                    </h3>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                        Level Code: {grade.levelCode}
                                    </p>
                                </div>
                                <div className="p-3 bg-[hsl(var(--muted))] text-[hsl(var(--primary))] rounded-xl group-hover:bg-[hsl(var(--primary))] group-hover:text-white transition-colors">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[hsl(var(--border))]">
                                <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                                    Manage Ledgers
                                </span>
                                <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-all group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {gradeLevels.length === 0 && (
                <div className="text-center py-12 bg-[hsl(var(--muted)/0.5)] rounded-2xl border border-dashed border-[hsl(var(--border))]">
                    <p className="text-[hsl(var(--muted-foreground))]">No grade levels found.</p>
                </div>
            )}
        </div>
    );
}
