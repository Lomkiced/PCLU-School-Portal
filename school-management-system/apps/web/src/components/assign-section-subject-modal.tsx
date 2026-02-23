"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { X, Loader2, BookOpen, Check } from "lucide-react";

interface Subject {
    id: string;
    code: string;
    name: string;
    subjectType: string;
}

interface Teacher {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
}

interface AssignSectionSubjectModalProps {
    open: boolean;
    sectionId: string;
    assignedSubjectIds: string[];
    onClose: () => void;
    onSuccess: () => void;
}

export function AssignSectionSubjectModal({ open, sectionId, assignedSubjectIds, onClose, onSuccess }: AssignSectionSubjectModalProps) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [selectedTeacherId, setSelectedTeacherId] = useState("");

    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    useEffect(() => {
        if (open) {
            setLoadingData(true);
            Promise.all([
                api.get("/subjects"),
                api.get("/teachers")
            ])
                .then(([subjRes, teachRes]) => {
                    setSubjects(subjRes.data.data || []);
                    setTeachers(teachRes.data.data || []);
                })
                .catch(() => setApiError("Failed to fetch selection data"))
                .finally(() => setLoadingData(false));

            setSelectedSubjectId("");
            setSelectedTeacherId("");
            setApiError("");
        }
    }, [open]);

    if (!open) return null;

    const availableSubjects = subjects.filter(s => !assignedSubjectIds.includes(s.id));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError("");
        if (!selectedSubjectId) return setApiError("Please select a subject");
        if (!selectedTeacherId) return setApiError("Please select a teacher");

        setLoading(true);
        try {
            await api.post(`/sections/${sectionId}/subjects`, {
                subjectId: selectedSubjectId,
                teacherId: selectedTeacherId,
            });
            onSuccess();
        } catch (err: any) {
            setApiError(err.response?.data?.message || "Failed to assign subject");
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
                            <BookOpen className="w-5 h-5 text-[hsl(var(--primary))]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Assign Subject</h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Add a new subject to this section</p>
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
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Subject *</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                >
                                    <option value="">Select subject</option>
                                    {availableSubjects.map((s) => (
                                        <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                                    ))}
                                </select>
                                {availableSubjects.length === 0 && subjects.length > 0 && (
                                    <p className="text-xs text-amber-500 mt-1">All available subjects are already assigned to this section.</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Teacher *</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                    value={selectedTeacherId}
                                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                                >
                                    <option value="">Select subject teacher</option>
                                    {teachers.filter(Boolean).map((t) => (
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
                    <button onClick={handleSubmit} disabled={loading || loadingData || availableSubjects.length === 0} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md shadow-[hsl(var(--primary)/0.25)] disabled:opacity-60">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</> : <>Assign</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
