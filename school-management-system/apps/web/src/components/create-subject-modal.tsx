"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { X, Loader2, BookPlus, Check } from "lucide-react";

interface Department {
    id: string;
    name: string;
}

interface SubjectOption {
    id: string;
    code: string;
    name: string;
}

interface CreateSubjectModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    code: string;
    name: string;
    units: string;
    credits: string;
    lectureHours: string;
    labHours: string;
    description: string;
    subjectType: string;
    departmentId: string;
    prerequisiteIds: string[];
}

interface FormErrors {
    code?: string;
    name?: string;
    units?: string;
    credits?: string;
    subjectType?: string;
}

const subjectTypes = [
    { value: "CORE", label: "Core", color: "bg-blue-500/10 text-blue-600" },
    { value: "ELECTIVE", label: "Elective", color: "bg-violet-500/10 text-violet-600" },
    { value: "SPECIALIZED", label: "Specialized", color: "bg-amber-500/10 text-amber-600" },
    { value: "HONORS", label: "Honors", color: "bg-emerald-500/10 text-emerald-600" },
    { value: "LAB", label: "Lab", color: "bg-cyan-500/10 text-cyan-600" },
];

const initialFormData: FormData = {
    code: "",
    name: "",
    units: "3",
    credits: "3",
    lectureHours: "3",
    labHours: "0",
    description: "",
    subjectType: "",
    departmentId: "",
    prerequisiteIds: [],
};

export function CreateSubjectModal({ open, onClose, onSuccess }: CreateSubjectModalProps) {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const [departments, setDepartments] = useState<Department[]>([]);
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [prereqSearch, setPrereqSearch] = useState("");

    useEffect(() => {
        if (open) {
            api.get("/departments").then((res) => setDepartments(res.data.data || [])).catch(() => { });
            api.get("/subjects").then((res) => setSubjects((res.data.data || []).map((s: any) => ({ id: s.id, code: s.code, name: s.name })))).catch(() => { });
        }
    }, [open]);

    if (!open) return null;

    const validate = (): boolean => {
        const e: FormErrors = {};
        if (!formData.code.trim()) e.code = "Subject code is required";
        if (!formData.name.trim()) e.name = "Subject name is required";
        if (!formData.units || Number(formData.units) <= 0) e.units = "Units must be greater than 0";
        if (!formData.credits || Number(formData.credits) < 0) e.credits = "Credits cannot be negative";
        if (!formData.subjectType) e.subjectType = "Subject type is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field as keyof FormErrors]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const togglePrereq = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            prerequisiteIds: prev.prerequisiteIds.includes(id)
                ? prev.prerequisiteIds.filter((pid) => pid !== id)
                : [...prev.prerequisiteIds, id],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError("");
        if (!validate()) return;

        setLoading(true);
        try {
            await api.post("/subjects", {
                code: formData.code.trim().toUpperCase(),
                name: formData.name.trim(),
                units: parseFloat(formData.units),
                credits: parseFloat(formData.credits),
                lectureHours: parseInt(formData.lectureHours) || 0,
                labHours: parseInt(formData.labHours) || 0,
                description: formData.description.trim() || undefined,
                subjectType: formData.subjectType,
                departmentId: formData.departmentId || undefined,
                prerequisiteIds: formData.prerequisiteIds.length > 0 ? formData.prerequisiteIds : undefined,
            });
            setFormData(initialFormData);
            setErrors({});
            onSuccess();
        } catch (err: any) {
            setApiError(err.response?.data?.message || "Failed to create subject");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData(initialFormData);
            setErrors({});
            setApiError("");
            onClose();
        }
    };

    const filteredSubjects = subjects.filter(
        (s) =>
        (s.code.toLowerCase().includes(prereqSearch.toLowerCase()) ||
            s.name.toLowerCase().includes(prereqSearch.toLowerCase()))
    );

    const inputClass = (field?: keyof FormErrors) =>
        `w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border text-sm font-medium placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:ring-2 transition-all ${field && errors[field] ? "border-red-500 focus:ring-red-500/30" : "border-[hsl(var(--border))] focus:ring-[hsl(var(--ring))]"
        }`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-[hsl(var(--card))] rounded-2xl w-full max-w-2xl shadow-2xl border border-[hsl(var(--border))]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                            <BookPlus className="w-5 h-5 text-[hsl(var(--primary))]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Create Subject</h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Add a new subject to the curriculum</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
                    {apiError && (
                        <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium text-center">{apiError}</div>
                    )}

                    {/* Code + Name */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider">Subject Details</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Code *</label>
                                <input className={inputClass("code")} placeholder="CS101" value={formData.code} onChange={(e) => handleChange("code", e.target.value)} />
                                {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Subject Name *</label>
                                <input className={inputClass("name")} placeholder="Introduction to Programming" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Description</label>
                            <textarea className={inputClass()} rows={2} placeholder="Brief description of the subject..." value={formData.description} onChange={(e) => handleChange("description", e.target.value)} />
                        </div>
                    </div>

                    <hr className="border-[hsl(var(--border))]" />

                    {/* Type + Department */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Subject Type *</label>
                            <select className={inputClass("subjectType")} value={formData.subjectType} onChange={(e) => handleChange("subjectType", e.target.value)}>
                                <option value="">Select type</option>
                                {subjectTypes.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            {errors.subjectType && <p className="text-xs text-red-500">{errors.subjectType}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Department</label>
                            <select className={inputClass()} value={formData.departmentId} onChange={(e) => handleChange("departmentId", e.target.value)}>
                                <option value="">No department</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Numeric Fields */}
                    <div className="grid grid-cols-4 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Units *</label>
                            <input type="number" step="0.5" min="0" className={inputClass("units")} value={formData.units} onChange={(e) => handleChange("units", e.target.value)} />
                            {errors.units && <p className="text-xs text-red-500">{errors.units}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Credits</label>
                            <input type="number" step="0.5" min="0" className={inputClass("credits")} value={formData.credits} onChange={(e) => handleChange("credits", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Lec Hours</label>
                            <input type="number" min="0" className={inputClass()} value={formData.lectureHours} onChange={(e) => handleChange("lectureHours", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Lab Hours</label>
                            <input type="number" min="0" className={inputClass()} value={formData.labHours} onChange={(e) => handleChange("labHours", e.target.value)} />
                        </div>
                    </div>

                    <hr className="border-[hsl(var(--border))]" />

                    {/* Prerequisites multi-select */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider">Prerequisites</h4>
                        <input
                            type="text"
                            placeholder="Search subjects..."
                            value={prereqSearch}
                            onChange={(e) => setPrereqSearch(e.target.value)}
                            className={inputClass()}
                        />
                        {formData.prerequisiteIds.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {formData.prerequisiteIds.map((pid) => {
                                    const s = subjects.find((sub) => sub.id === pid);
                                    return s ? (
                                        <span key={pid} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs font-semibold">
                                            {s.code}
                                            <button type="button" onClick={() => togglePrereq(pid)} className="hover:text-red-500 transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        )}
                        <div className="max-h-36 overflow-y-auto rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                            {filteredSubjects.length === 0 ? (
                                <p className="p-3 text-xs text-center text-[hsl(var(--muted-foreground))]">No subjects available</p>
                            ) : (
                                filteredSubjects.map((s) => {
                                    const selected = formData.prerequisiteIds.includes(s.id);
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => togglePrereq(s.id)}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-[hsl(var(--muted)/0.5)] transition-colors border-b border-[hsl(var(--border))] last:border-0 ${selected ? "bg-[hsl(var(--primary)/0.05)]" : ""}`}
                                        >
                                            <span>
                                                <span className="font-bold">{s.code}</span>{" "}
                                                <span className="text-[hsl(var(--muted-foreground))]">{s.name}</span>
                                            </span>
                                            {selected && <Check className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--border))]">
                    <button type="button" onClick={handleClose} disabled={loading} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-all disabled:opacity-50">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md shadow-[hsl(var(--primary)/0.25)] disabled:opacity-60">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><BookPlus className="w-4 h-4" /> Create Subject</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
