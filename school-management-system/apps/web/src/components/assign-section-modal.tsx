"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { X, Loader2, GraduationCap, School } from "lucide-react";

interface AssignSectionModalProps {
    open: boolean;
    student: { id: string; firstName: string; lastName: string } | null;
    onClose: () => void;
    onSuccess: () => void;
}

interface GradeLevel {
    id: string;
    name: string;
    schoolLevel: string;
}

interface Section {
    id: string;
    name: string;
    capacity: number;
    _count: { students: number };
}

export function AssignSectionModal({ open, student, onClose, onSuccess }: AssignSectionModalProps) {
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedGrade, setSelectedGrade] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [loadingGrades, setLoadingGrades] = useState(false);
    const [loadingSections, setLoadingSections] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Fetch grade levels when modal opens
    useEffect(() => {
        if (!open) return;
        setLoadingGrades(true);
        api.get("/grade-levels")
            .then((res) => setGradeLevels(res.data.data))
            .catch(() => setError("Failed to load grade levels"))
            .finally(() => setLoadingGrades(false));
    }, [open]);

    // Fetch sections when grade level changes (cascading)
    useEffect(() => {
        if (!selectedGrade) {
            setSections([]);
            setSelectedSection("");
            return;
        }
        setLoadingSections(true);
        setSelectedSection("");
        api.get(`/sections?gradeLevelId=${selectedGrade}`)
            .then((res) => setSections(res.data.data))
            .catch(() => setError("Failed to load sections"))
            .finally(() => setLoadingSections(false));
    }, [selectedGrade]);

    if (!open || !student) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!selectedGrade) { setError("Please select a grade level"); return; }
        if (!selectedSection) { setError("Please select a section"); return; }

        setSubmitting(true);
        try {
            await api.post(`/students/${student.id}/enroll`, {
                gradeLevelId: selectedGrade,
                sectionId: selectedSection,
            });
            handleClose();
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to enroll student");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setSelectedGrade("");
            setSelectedSection("");
            setSections([]);
            setError("");
            onClose();
        }
    };

    const selectClass = "w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-[hsl(var(--card))] rounded-2xl w-full max-w-md shadow-2xl border border-[hsl(var(--border))]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Assign Section</h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                Enroll <strong>{student.firstName} {student.lastName}</strong>
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    {/* Grade Level Dropdown */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Grade Level *</label>
                        <div className="relative">
                            <select
                                value={selectedGrade}
                                onChange={(e) => setSelectedGrade(e.target.value)}
                                className={selectClass}
                                disabled={loadingGrades}
                            >
                                <option value="">
                                    {loadingGrades ? "Loading grade levels..." : "Select a grade level"}
                                </option>
                                {gradeLevels.map((gl) => (
                                    <option key={gl.id} value={gl.id}>
                                        {gl.name} ({gl.schoolLevel})
                                    </option>
                                ))}
                            </select>
                            {loadingGrades && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[hsl(var(--muted-foreground))]" />
                            )}
                        </div>
                    </div>

                    {/* Section Dropdown (Cascading) */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Section *</label>
                        <div className="relative">
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className={selectClass}
                                disabled={!selectedGrade || loadingSections}
                            >
                                <option value="">
                                    {!selectedGrade
                                        ? "Select a grade level first"
                                        : loadingSections
                                            ? "Loading sections..."
                                            : sections.length === 0
                                                ? "No sections available"
                                                : "Select a section"
                                    }
                                </option>
                                {sections.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s._count.students}/{s.capacity} students)
                                    </option>
                                ))}
                            </select>
                            {loadingSections && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[hsl(var(--muted-foreground))]" />
                            )}
                        </div>
                    </div>

                    {/* Selected Preview */}
                    {selectedGrade && selectedSection && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-600 font-medium">
                            <School className="w-4 h-4 shrink-0" />
                            <span>
                                Will enroll to: {gradeLevels.find(g => g.id === selectedGrade)?.name} — {sections.find(s => s.id === selectedSection)?.name}
                            </span>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--border))]">
                    <button type="button" onClick={handleClose} disabled={submitting} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-all disabled:opacity-50">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={submitting || !selectedGrade || !selectedSection}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/25 disabled:opacity-60"
                    >
                        {submitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Enrolling...</>
                        ) : (
                            <><GraduationCap className="w-4 h-4" /> Enroll Student</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
