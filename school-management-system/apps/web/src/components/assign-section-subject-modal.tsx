"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { X, Loader2, UserPlus } from "lucide-react";

interface Teacher {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
}

interface AssignTeacherModalProps {
    open: boolean;
    sectionId: string;
    subjectId: string;
    subjectName: string;
    currentTeacherId?: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function AssignTeacherModal({ open, sectionId, subjectId, subjectName, currentTeacherId, onClose, onSuccess }: AssignTeacherModalProps) {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState("");
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    useEffect(() => {
        if (open) {
            setLoadingData(true);
            api.get("/teachers")
                .then((res) => {
                    setTeachers(res.data.data || []);
                    setSelectedTeacherId(currentTeacherId || "");
                })
                .catch(() => setApiError("Failed to fetch teachers"))
                .finally(() => setLoadingData(false));

            setApiError("");
        }
    }, [open, currentTeacherId]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError("");
        if (!selectedTeacherId) return setApiError("Please select a teacher");

        setLoading(true);
        try {
            await api.patch(`/sections/${sectionId}/subjects/${subjectId}`, {
                teacherId: selectedTeacherId,
            });
            onSuccess();
        } catch (err: any) {
            setApiError(err.response?.data?.message || "Failed to assign teacher");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && onClose()} />
            <div className="relative bg-[hsl(var(--card))] rounded-2xl w-full max-w-md shadow-2xl border border-[hsl(var(--border))]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-[hsl(var(--primary))]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Assign Teacher</h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Assign a teacher to {subjectName}</p>
                        </div>
                    </div>
                    <button onClick={() => !loading && onClose()} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {apiError && (
                        <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium text-center">{apiError}</div>
                    )}

                    {loadingData ? (
                        <div className="py-8 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Subject</label>
                                <input
                                    type="text"
                                    disabled
                                    className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] text-sm font-medium text-[hsl(var(--muted-foreground))] cursor-not-allowed"
                                    value={subjectName}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Teacher *</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                    value={selectedTeacherId}
                                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                                >
                                    <option value="">Select subject teacher</option>
                                    {teachers.map((t) => (
                                        <option key={t.id} value={t.id}>{t.lastName}, {t.firstName} ({t.employeeId})</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--border))]">
                    <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-all disabled:opacity-50">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading || loadingData} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md shadow-[hsl(var(--primary)/0.25)] disabled:opacity-60">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</> : <>Save Assignment</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
