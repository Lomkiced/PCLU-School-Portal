"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Megaphone, CalendarIcon, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const announcementSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    content: z.string().min(10, "Content must be at least 10 characters"),
    priority: z.enum(["INFO", "WARNING", "URGENT"]),
    status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]),
    targetRoles: z.array(z.string()).optional(),
    targetGradeLevels: z.array(z.string()).optional(),
    targetSections: z.array(z.string()).optional(),
    publishedAt: z.string().optional(),
    expiresAt: z.string().optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

interface AnnouncementBuilderProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: AnnouncementFormValues) => void;
}

export function AnnouncementBuilder({ open, onClose, onSubmit }: AnnouncementBuilderProps) {
    const { control, handleSubmit, register, watch, formState: { errors } } = useForm<AnnouncementFormValues>({
        resolver: zodResolver(announcementSchema),
        defaultValues: {
            title: "",
            content: "",
            priority: "INFO",
            status: "PUBLISHED",
            targetRoles: [],
            targetGradeLevels: [],
            targetSections: [],
        }
    });

    const onSubmitForm = (data: AnnouncementFormValues) => {
        onSubmit(data);
    };

    return (
        <Modal open={open} onClose={onClose} title="Create Announcement" size="lg">
            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <label className="text-sm font-medium">Title</label>
                        <input
                            {...register("title")}
                            className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                            placeholder="Announcement title"
                        />
                        {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <label className="text-sm font-medium">Priority</label>
                        <select
                            {...register("priority")}
                            className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                        >
                            <option value="INFO">Info</option>
                            <option value="WARNING">Warning</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Content</label>
                    <div className="bg-[hsl(var(--muted))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
                        <Controller
                            name="content"
                            control={control}
                            render={({ field }) => (
                                <ReactQuill
                                    theme="snow"
                                    value={field.value}
                                    onChange={field.onChange}
                                    className="bg-transparent border-none min-h-[150px]"
                                />
                            )}
                        />
                    </div>
                    {errors.content && <p className="text-red-500 text-xs">{errors.content.message}</p>}
                </div>

                {/* Targeting Section */}
                <div className="p-4 border border-[hsl(var(--border))] rounded-2xl bg-[hsl(var(--card))] space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-primary" /> Target Audience
                    </h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Leave targeting blank to make the announcement visible to everyone.</p>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium">Target Roles</label>
                            <Controller
                                name="targetRoles"
                                control={control}
                                render={({ field }) => (
                                    <select
                                        multiple
                                        value={field.value}
                                        onChange={(e) => field.onChange(Array.from(e.target.selectedOptions, option => option.value))}
                                        className="w-full p-2 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm h-24"
                                    >
                                        <option value="STUDENT">Students</option>
                                        <option value="TEACHER">Teachers</option>
                                        <option value="PARENT">Parents</option>
                                        <option value="ADMIN">Admins</option>
                                    </select>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium">Target Grade Levels</label>
                            <Controller
                                name="targetGradeLevels"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="text"
                                        placeholder="e.g. UUID (Leave blank for now)"
                                        className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm"
                                        onChange={(e) => field.onChange(e.target.value ? [e.target.value] : [])}
                                    />
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium">Target Sections</label>
                            <Controller
                                name="targetSections"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="text"
                                        placeholder="e.g. UUID (Leave blank for now)"
                                        className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm"
                                        onChange={(e) => field.onChange(e.target.value ? [e.target.value] : [])}
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Scheduling */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Publish At (Optional)</label>
                        <input
                            type="datetime-local"
                            {...register("publishedAt")}
                            className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Expires At (Optional)</label>
                        <input
                            type="datetime-local"
                            {...register("expiresAt")}
                            className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
                    <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                    <Button type="submit"><Megaphone className="w-4 h-4 mr-2" /> Publish Announcement</Button>
                </div>
            </form>
        </Modal>
    );
}
