"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { X, Loader2, UserPlus, Info } from "lucide-react";

interface AddFacultyModalProps {
    open: boolean;
    departmentId: string;
    departmentName: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    contactNumber: string;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    position?: string;
    contactNumber?: string;
}

const initialFormData: FormData = {
    firstName: "",
    lastName: "",
    email: "",
    position: "",
    contactNumber: "",
};

export function AddFacultyModal({ open, departmentId, departmentName, onClose, onSuccess }: AddFacultyModalProps) {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState("");

    if (!open) return null;

    const validate = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Enter a valid email address";
        }
        if (!formData.position.trim()) newErrors.position = "Position/title is required";
        if (!formData.contactNumber.trim()) {
            newErrors.contactNumber = "Contact number is required";
        } else if (formData.contactNumber.trim().length < 7) {
            newErrors.contactNumber = "Please enter a valid contact number";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError("");

        if (!validate()) return;

        setSubmitting(true);
        try {
            await api.post("/teachers/add", {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim().toLowerCase(),
                position: formData.position.trim(),
                contactNumber: formData.contactNumber.trim(),
                departmentId,
            });
            setFormData(initialFormData);
            setErrors({});
            onSuccess();
        } catch (err: any) {
            setApiError(err.response?.data?.message || "Failed to add faculty member");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setFormData(initialFormData);
            setErrors({});
            setApiError("");
            onClose();
        }
    };

    const inputClass = (field: keyof FormErrors) =>
        `w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border text-sm font-medium placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:ring-2 transition-all ${errors[field]
            ? "border-red-500 focus:ring-red-500/30"
            : "border-[hsl(var(--border))] focus:ring-[hsl(var(--ring))]"
        }`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-[hsl(var(--card))] rounded-2xl w-full max-w-lg shadow-2xl border border-[hsl(var(--border))]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-[hsl(var(--primary))]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Add Faculty Member</h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                Adding to <strong>{departmentName}</strong>
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    {apiError && (
                        <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium text-center">{apiError}</div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">First Name *</label>
                            <input
                                className={inputClass("firstName")}
                                placeholder="Juan"
                                value={formData.firstName}
                                onChange={(e) => handleChange("firstName", e.target.value)}
                            />
                            {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Last Name *</label>
                            <input
                                className={inputClass("lastName")}
                                placeholder="Dela Cruz"
                                value={formData.lastName}
                                onChange={(e) => handleChange("lastName", e.target.value)}
                            />
                            {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Email Address *</label>
                        <input
                            type="email"
                            className={inputClass("email")}
                            placeholder="juan.delacruz@pclu.edu.ph"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                        />
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Title / Position *</label>
                            <input
                                className={inputClass("position")}
                                placeholder="e.g. Senior Teacher II"
                                value={formData.position}
                                onChange={(e) => handleChange("position", e.target.value)}
                            />
                            {errors.position && <p className="text-xs text-red-500">{errors.position}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Contact Number *</label>
                            <input
                                className={inputClass("contactNumber")}
                                placeholder="+63 912 345 6789"
                                value={formData.contactNumber}
                                onChange={(e) => handleChange("contactNumber", e.target.value)}
                            />
                            {errors.contactNumber && <p className="text-xs text-red-500">{errors.contactNumber}</p>}
                        </div>
                    </div>

                    {/* Default Password Note */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 text-blue-600 text-xs font-medium">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Default Password</p>
                            <p className="mt-0.5 opacity-80">
                                The faculty account will be created with the default password <strong>&quot;teacher123&quot;</strong>.
                                They will be prompted to change it on first login.
                            </p>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--border))]">
                    <button type="button" onClick={handleClose} disabled={submitting} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-all disabled:opacity-50">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md shadow-[hsl(var(--primary)/0.25)] disabled:opacity-60"
                    >
                        {submitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                        ) : (
                            <><UserPlus className="w-4 h-4" /> Add Faculty</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
