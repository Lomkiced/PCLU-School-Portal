"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { X, Loader2, Plus, School } from "lucide-react";

interface CreateGradeLevelModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const schoolLevels = [
    { value: "KINDER", label: "Kindergarten" },
    { value: "ELEM", label: "Elementary" },
    { value: "JHS", label: "Junior High School" },
    { value: "SHS", label: "Senior High School" },
];

export function CreateGradeLevelModal({ open, onClose, onSuccess }: CreateGradeLevelModalProps) {
    const [name, setName] = useState("");
    const [schoolLevel, setSchoolLevel] = useState("");
    const [nameError, setNameError] = useState("");
    const [levelError, setLevelError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState("");

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError("");
        let hasError = false;

        if (!name.trim()) { setNameError("Name is required"); hasError = true; } else { setNameError(""); }
        if (!schoolLevel) { setLevelError("School level is required"); hasError = true; } else { setLevelError(""); }
        if (hasError) return;

        setSubmitting(true);
        try {
            await api.post("/grade-levels", { name: name.trim(), schoolLevel });
            handleClose();
            onSuccess();
        } catch (err: any) {
            setApiError(err.response?.data?.message || "Failed to create grade level");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setName(""); setSchoolLevel(""); setNameError(""); setLevelError(""); setApiError("");
            onClose();
        }
    };

    const inputClass = (hasError: boolean) =>
        `w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border text-sm font-medium placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:ring-2 transition-all ${hasError ? "border-red-500 focus:ring-red-500/30" : "border-[hsl(var(--border))] focus:ring-[hsl(var(--ring))]"}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-[hsl(var(--card))] rounded-2xl w-full max-w-md shadow-2xl border border-[hsl(var(--border))]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                            <School className="w-5 h-5 text-[hsl(var(--primary))]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Create Grade Level</h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Add a new grade level to the system</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {apiError && (
                        <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium text-center">{apiError}</div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Grade Level Name *</label>
                        <input
                            className={inputClass(!!nameError)}
                            placeholder="e.g. Grade 1, Grade 7 - STEM"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setNameError(""); }}
                        />
                        {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">School Level *</label>
                        <select
                            className={inputClass(!!levelError)}
                            value={schoolLevel}
                            onChange={(e) => { setSchoolLevel(e.target.value); setLevelError(""); }}
                        >
                            <option value="">Select school level</option>
                            {schoolLevels.map((sl) => (
                                <option key={sl.value} value={sl.value}>{sl.label}</option>
                            ))}
                        </select>
                        {levelError && <p className="text-xs text-red-500">{levelError}</p>}
                    </div>
                </form>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--border))]">
                    <button type="button" onClick={handleClose} disabled={submitting} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-all disabled:opacity-50">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md shadow-[hsl(var(--primary)/0.25)] disabled:opacity-60"
                    >
                        {submitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                        ) : (
                            <><Plus className="w-4 h-4" /> Create Grade Level</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
