"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { X, Loader2, Pencil } from "lucide-react";

interface Student {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    gender: string;
    user: { email: string };
    parents: { firstName: string; lastName: string; contactNumber: string }[];
}

interface EditStudentModalProps {
    open: boolean;
    student: Student | null;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    gender: string;
    parentFirstName: string;
    parentLastName: string;
    parentContactNumber: string;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    gender?: string;
    parentFirstName?: string;
    parentLastName?: string;
    parentContactNumber?: string;
}

const genderOptions = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
];

export function EditStudentModal({ open, student, onClose, onSuccess }: EditStudentModalProps) {
    const [formData, setFormData] = useState<FormData>({
        firstName: "",
        lastName: "",
        email: "",
        gender: "",
        parentFirstName: "",
        parentLastName: "",
        parentContactNumber: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    // Pre-populate form when student changes
    useEffect(() => {
        if (student) {
            setFormData({
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.user.email,
                gender: student.gender,
                parentFirstName: student.parents?.[0]?.firstName || "",
                parentLastName: student.parents?.[0]?.lastName || "",
                parentContactNumber: student.parents?.[0]?.contactNumber || "",
            });
            setErrors({});
            setApiError("");
        }
    }, [student]);

    if (!open || !student) return null;

    const validate = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Enter a valid email address";
        }
        if (!formData.gender) newErrors.gender = "Gender is required";
        if (!formData.parentFirstName.trim()) newErrors.parentFirstName = "Parent first name is required";
        if (!formData.parentLastName.trim()) newErrors.parentLastName = "Parent last name is required";
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
            await api.patch(`/students/${student.id}`, {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim().toLowerCase(),
                gender: formData.gender,
                parentFirstName: formData.parentFirstName.trim(),
                parentLastName: formData.parentLastName.trim(),
                parentContactNumber: formData.parentContactNumber.trim(),
            });
            onSuccess();
        } catch (err: any) {
            setApiError(err.response?.data?.message || "Failed to update student");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
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
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Pencil className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Edit Student</h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                {student.studentId} — {student.lastName}, {student.firstName}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    {apiError && (
                        <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium text-center">{apiError}</div>
                    )}

                    {/* Student Info */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">Student Information</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">First Name *</label>
                                <input className={inputClass("firstName")} value={formData.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
                                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Last Name *</label>
                                <input className={inputClass("lastName")} value={formData.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
                                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Email *</label>
                                <input type="email" className={inputClass("email")} value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
                                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Gender *</label>
                                <select className={inputClass("gender")} value={formData.gender} onChange={(e) => handleChange("gender", e.target.value)}>
                                    <option value="">Select gender</option>
                                    {genderOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
                            </div>
                        </div>
                    </div>

                    <hr className="border-[hsl(var(--border))]" />

                    {/* Parent Info */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">Parent / Guardian</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">First Name *</label>
                                <input className={inputClass("parentFirstName")} value={formData.parentFirstName} onChange={(e) => handleChange("parentFirstName", e.target.value)} />
                                {errors.parentFirstName && <p className="text-xs text-red-500">{errors.parentFirstName}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Last Name *</label>
                                <input className={inputClass("parentLastName")} value={formData.parentLastName} onChange={(e) => handleChange("parentLastName", e.target.value)} />
                                {errors.parentLastName && <p className="text-xs text-red-500">{errors.parentLastName}</p>}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Contact Number *</label>
                            <input type="tel" className={inputClass("parentContactNumber")} value={formData.parentContactNumber} onChange={(e) => handleChange("parentContactNumber", e.target.value)} />
                            {errors.parentContactNumber && <p className="text-xs text-red-500">{errors.parentContactNumber}</p>}
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--border))]">
                    <button type="button" onClick={handleClose} disabled={loading} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-all disabled:opacity-50">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all shadow-md shadow-amber-500/25 disabled:opacity-60">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Pencil className="w-4 h-4" /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
