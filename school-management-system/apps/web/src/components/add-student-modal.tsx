"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { X, Loader2, UserPlus, Info } from "lucide-react";

interface AddStudentModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    studentFirstName: string;
    studentLastName: string;
    studentEmail: string;
    studentGender: string;
    parentFirstName: string;
    parentLastName: string;
    parentOccupation: string;
    parentContactNumber: string;
}

interface FormErrors {
    studentFirstName?: string;
    studentLastName?: string;
    studentEmail?: string;
    studentGender?: string;
    parentFirstName?: string;
    parentLastName?: string;
    parentOccupation?: string;
    parentContactNumber?: string;
}

const initialFormData: FormData = {
    studentFirstName: "",
    studentLastName: "",
    studentEmail: "",
    studentGender: "",
    parentFirstName: "",
    parentLastName: "",
    parentOccupation: "",
    parentContactNumber: "",
};

const genderOptions = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
];

export function AddStudentModal({ open, onClose, onSuccess }: AddStudentModalProps) {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    if (!open) return null;

    const validate = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.studentFirstName.trim()) newErrors.studentFirstName = "First name is required";
        if (!formData.studentLastName.trim()) newErrors.studentLastName = "Last name is required";
        if (!formData.studentEmail.trim()) {
            newErrors.studentEmail = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.studentEmail)) {
            newErrors.studentEmail = "Enter a valid email address";
        }
        if (!formData.studentGender) newErrors.studentGender = "Gender is required";
        if (!formData.parentFirstName.trim()) newErrors.parentFirstName = "Parent first name is required";
        if (!formData.parentLastName.trim()) newErrors.parentLastName = "Parent last name is required";
        if (!formData.parentOccupation.trim()) newErrors.parentOccupation = "Occupation is required";
        if (!formData.parentContactNumber.trim()) {
            newErrors.parentContactNumber = "Contact number is required";
        } else if (formData.parentContactNumber.trim().length < 7) {
            newErrors.parentContactNumber = "Contact number must be at least 7 digits";
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

        setLoading(true);
        try {
            await api.post("/students", {
                student: {
                    firstName: formData.studentFirstName.trim(),
                    lastName: formData.studentLastName.trim(),
                    email: formData.studentEmail.trim().toLowerCase(),
                    gender: formData.studentGender,
                },
                parent: {
                    firstName: formData.parentFirstName.trim(),
                    lastName: formData.parentLastName.trim(),
                    occupation: formData.parentOccupation.trim(),
                    contactNumber: formData.parentContactNumber.trim(),
                },
            });
            setFormData(initialFormData);
            setErrors({});
            onSuccess();
        } catch (err: any) {
            setApiError(err.response?.data?.message || "Failed to create student. Please try again.");
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

    const inputClass = (field: keyof FormErrors) =>
        `w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border text-sm font-medium placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:ring-2 transition-all ${errors[field]
            ? "border-red-500 focus:ring-red-500/30"
            : "border-[hsl(var(--border))] focus:ring-[hsl(var(--ring))]"
        }`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-[hsl(var(--card))] rounded-2xl w-full max-w-lg shadow-2xl border border-[hsl(var(--border))] animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-[hsl(var(--primary))]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Add New Student</h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                Create a student and parent account
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* API Error */}
                    {apiError && (
                        <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium text-center">
                            {apiError}
                        </div>
                    )}

                    {/* Student Info Section */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">
                            Student Information
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">First Name *</label>
                                <input
                                    className={inputClass("studentFirstName")}
                                    placeholder="Juan"
                                    value={formData.studentFirstName}
                                    onChange={(e) => handleChange("studentFirstName", e.target.value)}
                                />
                                {errors.studentFirstName && <p className="text-xs text-red-500">{errors.studentFirstName}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Last Name *</label>
                                <input
                                    className={inputClass("studentLastName")}
                                    placeholder="Dela Cruz"
                                    value={formData.studentLastName}
                                    onChange={(e) => handleChange("studentLastName", e.target.value)}
                                />
                                {errors.studentLastName && <p className="text-xs text-red-500">{errors.studentLastName}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Email Address *</label>
                                <input
                                    type="email"
                                    className={inputClass("studentEmail")}
                                    placeholder="juan@pclu.edu.ph"
                                    value={formData.studentEmail}
                                    onChange={(e) => handleChange("studentEmail", e.target.value)}
                                />
                                {errors.studentEmail && <p className="text-xs text-red-500">{errors.studentEmail}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Gender *</label>
                                <select
                                    className={inputClass("studentGender")}
                                    value={formData.studentGender}
                                    onChange={(e) => handleChange("studentGender", e.target.value)}
                                >
                                    <option value="">Select gender</option>
                                    {genderOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {errors.studentGender && <p className="text-xs text-red-500">{errors.studentGender}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <hr className="border-[hsl(var(--border))]" />

                    {/* Parent Info Section */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">
                            Parent / Guardian Information
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">First Name *</label>
                                <input
                                    className={inputClass("parentFirstName")}
                                    placeholder="Maria"
                                    value={formData.parentFirstName}
                                    onChange={(e) => handleChange("parentFirstName", e.target.value)}
                                />
                                {errors.parentFirstName && <p className="text-xs text-red-500">{errors.parentFirstName}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Last Name *</label>
                                <input
                                    className={inputClass("parentLastName")}
                                    placeholder="Dela Cruz"
                                    value={formData.parentLastName}
                                    onChange={(e) => handleChange("parentLastName", e.target.value)}
                                />
                                {errors.parentLastName && <p className="text-xs text-red-500">{errors.parentLastName}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Occupation *</label>
                                <input
                                    className={inputClass("parentOccupation")}
                                    placeholder="e.g. Teacher, Engineer"
                                    value={formData.parentOccupation}
                                    onChange={(e) => handleChange("parentOccupation", e.target.value)}
                                />
                                {errors.parentOccupation && <p className="text-xs text-red-500">{errors.parentOccupation}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Contact Number *</label>
                                <input
                                    type="tel"
                                    className={inputClass("parentContactNumber")}
                                    placeholder="09171234567"
                                    value={formData.parentContactNumber}
                                    onChange={(e) => handleChange("parentContactNumber", e.target.value)}
                                />
                                {errors.parentContactNumber && <p className="text-xs text-red-500">{errors.parentContactNumber}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Default Password Note */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 text-blue-600 text-xs font-medium">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Default Password</p>
                            <p className="mt-0.5 opacity-80">
                                The student account will be created with the default password <strong>&quot;student123&quot;</strong>.
                                The parent account will use <strong>&quot;parent123&quot;</strong>.
                                Both will be prompted to change their password on first login.
                            </p>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--border))]">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md shadow-[hsl(var(--primary)/0.25)] disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4" /> Create Student
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
