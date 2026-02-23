"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { X, Loader2, AlertTriangle, Trash2 } from "lucide-react";

interface DeleteStudentModalProps {
    open: boolean;
    student: { id: string; studentId: string; firstName: string; lastName: string } | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function DeleteStudentModal({ open, student, onClose, onSuccess }: DeleteStudentModalProps) {
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    if (!open || !student) return null;

    const handleDelete = async () => {
        setApiError("");
        setLoading(true);
        try {
            await api.delete(`/students/${student.id}`);
            onSuccess();
        } catch (err: any) {
            setApiError(err.response?.data?.message || "Failed to delete student");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setApiError("");
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-[hsl(var(--card))] rounded-2xl w-full max-w-md shadow-2xl border border-[hsl(var(--border))]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-red-500">Delete Student</h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Permanent & irreversible action</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {apiError && (
                        <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium text-center">{apiError}</div>
                    )}

                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                        <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                            Are you sure you want to permanently delete this student?
                        </p>
                        <div className="mt-3 p-3 rounded-lg bg-[hsl(var(--muted))]">
                            <p className="text-sm font-bold">{student.lastName}, {student.firstName}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{student.studentId}</p>
                        </div>
                        <ul className="mt-3 space-y-1.5 text-xs text-red-500 font-medium">
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5">•</span>
                                <span>The student&apos;s user account will be deleted</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5">•</span>
                                <span>Their parent/guardian account will be removed if no other children are linked</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5">•</span>
                                <span>All enrollments, grades, attendance, and fee records will be erased</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5">•</span>
                                <span className="font-bold">This action cannot be undone</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--border))]">
                    <button type="button" onClick={handleClose} disabled={loading} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-all disabled:opacity-50">
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all shadow-md shadow-red-500/25 disabled:opacity-60"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                        ) : (
                            <><Trash2 className="w-4 h-4" /> Confirm Delete</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
