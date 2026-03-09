"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, AlertCircle, Plus, Trash2, CalendarX2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getDurationInMinutes, getGridRowStart, getGridRowSpan, getDayColumn } from "@/lib/time-utils";

const timeslotSchema = z.object({
    dayOfWeek: z.string().min(1, "Day is required"),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
    subjectId: z.string().min(1, "Subject is required"),
    teacherId: z.string().min(1, "Teacher is required"),
    roomId: z.string().min(1, "Room is required"),
}).refine((data) => data.startTime < data.endTime, {
    message: "End time must be strictly after start time",
    path: ["endTime"],
});

type TimeslotFormValues = z.infer<typeof timeslotSchema>;

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const HOURS = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

interface Timeslot {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    subjectId: string;
    subject: { name: string; code: string };
    teacherId: string;
    teacher: { firstName: string; lastName: string };
    roomId: string;
    room: { name: string };
}

interface ScheduleBuilderProps {
    sectionId: string;
}

export function ScheduleBuilder({ sectionId }: ScheduleBuilderProps) {
    const [section, setSection] = useState<any>(null);
    const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Lookups
    const [teachers, setTeachers] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [activeAy, setActiveAy] = useState<any>(null);
    const [inheritedSubjects, setInheritedSubjects] = useState<any[]>([]);

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isTeacherDisabled, setIsTeacherDisabled] = useState(false);

    const form = useForm<TimeslotFormValues>({
        resolver: zodResolver(timeslotSchema),
        defaultValues: {
            dayOfWeek: "MONDAY",
            startTime: "07:00",
            endTime: "08:00",
            subjectId: "",
            teacherId: "",
            roomId: ""
        }
    });

    const { control, handleSubmit, setValue, formState: { errors }, reset } = form;
    const selectedSubjectId = useWatch({ control, name: "subjectId" });

    // Watch for subject change to auto-assign teacher
    useEffect(() => {
        if (selectedSubjectId && inheritedSubjects.length > 0) {
            const inheritedSub = inheritedSubjects.find((s: any) => s.id === selectedSubjectId);
            if (inheritedSub && inheritedSub.teacherId) {
                setValue("teacherId", inheritedSub.teacherId, { shouldValidate: true, shouldDirty: true });
                setIsTeacherDisabled(true);
            } else {
                setValue("teacherId", "");
                setIsTeacherDisabled(false);
            }
        } else {
            setValue("teacherId", "");
            setIsTeacherDisabled(false);
        }
    }, [selectedSubjectId, inheritedSubjects, setValue]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [secRes, tsRes, teachRes, roomRes, ayRes, inheritedRes] = await Promise.all([
                api.get(`/sections/${sectionId}`),
                api.get(`/timetable/section/${sectionId}`),
                api.get(`/teachers`),
                api.get(`/rooms`),
                api.get(`/academic-years`),
                api.get(`/sections/${sectionId}/subjects`)
            ]);

            setSection(secRes.data.data);
            setTimeslots(tsRes.data.data || []);
            setTeachers(teachRes.data.data?.data || teachRes.data.data || []);
            setRooms(roomRes.data.data || []);
            setActiveAy(ayRes.data.data?.find((ay: any) => ay.status === 'ACTIVE') || ayRes.data.data?.[0]);
            setInheritedSubjects(inheritedRes.data.data || []);
        } catch (err) {
            setError("Failed to load schedule data.");
        } finally {
            setLoading(false);
        }
    }, [sectionId]);

    useEffect(() => {
        if (sectionId) fetchData();
    }, [sectionId, fetchData]);

    const onSubmit = async (data: TimeslotFormValues) => {
        if (!activeAy) {
            toast.error("No active academic year found.");
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/timetable/sections/${sectionId}`, {
                ...data,
                academicYearId: activeAy.id
            });
            toast.success("Timeslot added successfully!");
            setIsAddModalOpen(false);
            fetchData(); // Reload schedule
        } catch (error: any) {
            const errData = error.response?.data;
            let errorMessage = "Failed to add timeslot. Conflict detected.";

            if (errData?.message) {
                if (typeof errData.message === 'string') {
                    errorMessage = errData.message;
                } else if (Array.isArray(errData.message)) {
                    errorMessage = errData.message[0];
                } else if (typeof errData.message === 'object' && errData.message.message) {
                    errorMessage = errData.message.message;
                }
            } else if (errData?.error && typeof errData.error === 'string') {
                errorMessage = errData.error;
            }

            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddClick = (dayStr: string, hourStr: string) => {
        const startInt = parseInt(hourStr.split(":")[0]);
        const endStr = `${(startInt + 1).toString().padStart(2, "0")}:00`;
        reset({ dayOfWeek: dayStr, startTime: hourStr, endTime: endStr, subjectId: "", teacherId: "", roomId: "" });
        setIsTeacherDisabled(false); // Reset disabled state
        setIsAddModalOpen(true);
    };

    const handleDeleteBlock = async (id: string) => {
        if (!confirm("Are you sure you want to remove this block?")) return;
        try {
            await api.delete(`/timetable/timeslot/${id}`);
            toast.success("Timeslot removed.");
            setTimeslots((prev) => prev.filter((t) => t.id !== id));
        } catch (error) {
            toast.error("Failed to delete timeslot.");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
                <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Loading schedule...</p>
            </div>
        );
    }

    if (error || !section) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3 text-[hsl(var(--destructive))]">
                <AlertCircle className="w-8 h-8" />
                <p className="font-medium text-lg">{error || "Section not found"}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{section.name} Schedule</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        Manage classes and resolve conflicts for this section
                    </p>
                </div>
                <button
                    onClick={() => handleAddClick("MONDAY", "07:00")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-primary-foreground text-sm font-semibold rounded-lg hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Add Block
                </button>
            </div>

            {/* Weekly Proportional Grid */}
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 shadow-sm overflow-x-auto flex-1 custom-scrollbar">
                <div
                    className="min-w-[800px] grid grid-cols-[80px_repeat(5,1fr)] gap-x-3 relative h-full"
                    style={{ gridTemplateRows: "auto repeat(48, minmax(1.5rem, 1fr))" }}
                >
                    {/* Header Row */}
                    <div className="col-start-1" style={{ gridRow: 1 }}></div>
                    {DAYS.map((day, idx) => (
                        <div key={day} className="text-center font-semibold text-[hsl(var(--muted-foreground))] pb-4 border-b border-[hsl(var(--border))] z-10 bg-[hsl(var(--card))] sticky top-0" style={{ gridColumnStart: idx + 2, gridRow: 1 }}>
                            {day}
                        </div>
                    ))}

                    {/* Background Grid Lines (Horizontal) */}
                    {Array.from({ length: 13 }).map((_, idx) => (
                        <div key={`line-${idx}`} className="col-start-2 col-span-5 border-t border-[hsl(var(--border)/0.5)] z-0 pointer-events-none" style={{ gridRowStart: 2 + idx * 4 }} />
                    ))}

                    {/* Time Labels */}
                    {HOURS.map((hour, idx) => (
                        <div key={hour} className="col-start-1 text-right pr-4 text-xs font-medium text-[hsl(var(--muted-foreground))] z-10 translate-y-[-0.75rem]" style={{ gridRowStart: 2 + idx * 4 }}>
                            {hour}
                        </div>
                    ))}

                    {/* Timeslot Blocks */}
                    {timeslots.map((slot) => {
                        const rowStart = getGridRowStart(slot.startTime);
                        const span = getGridRowSpan(getDurationInMinutes(slot.startTime, slot.endTime));
                        const colStart = getDayColumn(slot.dayOfWeek);

                        return (
                            <div
                                key={slot.id}
                                className="relative z-10 group bg-[hsl(var(--primary)/0.15)] border border-[hsl(var(--primary)/0.3)] rounded-lg py-1.5 px-2.5 overflow-hidden hover:bg-[hsl(var(--primary)/0.2)] hover:shadow-md transition-all flex flex-col justify-start"
                                style={{
                                    gridRowStart: rowStart,
                                    gridRowEnd: `span ${span}`,
                                    gridColumnStart: colStart,
                                    marginTop: '2px', // slight gap 
                                    marginBottom: '2px'
                                }}
                            >
                                <p className="font-bold text-[hsl(var(--foreground))] text-xs sm:text-sm truncate">
                                    {slot.subject.name}
                                </p>
                                <p className="text-[10px] sm:text-[11px] text-[hsl(var(--primary))] font-medium truncate mt-0.5">
                                    {slot.teacher.firstName} {slot.teacher.lastName}
                                </p>
                                <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate mt-1">
                                    {slot.startTime} - {slot.endTime} • Rm {slot.room.name}
                                </p>

                                <button
                                    onClick={() => handleDeleteBlock(slot.id)}
                                    className="absolute top-1.5 right-1.5 p-1 bg-red-500/10 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        );
                    })}

                    {timeslots.length === 0 && (
                        <div className="absolute inset-0 top-12 flex flex-col items-center justify-center text-[hsl(var(--muted-foreground))] pointer-events-none">
                            <CalendarX2 className="w-12 h-12 mb-4 opacity-50" />
                            <p>No classes scheduled for this section yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Block Modal */}
            <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Class Block">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Day</label>
                            <select
                                {...form.register("dayOfWeek")}
                                className="w-full p-2.5 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] outline-none transition-all"
                            >
                                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            {errors.dayOfWeek && <p className="text-xs text-red-500">{errors.dayOfWeek.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Start Time</label>
                            <input
                                type="time"
                                {...form.register("startTime")}
                                className="w-full p-2.5 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] outline-none transition-all"
                            />
                            {errors.startTime && <p className="text-xs text-red-500">{errors.startTime.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">End Time</label>
                            <input
                                type="time"
                                {...form.register("endTime")}
                                className="w-full p-2.5 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] outline-none transition-all"
                            />
                            {errors.endTime && <p className="text-xs text-red-500">{errors.endTime.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Subject</label>
                        <select
                            {...form.register("subjectId")}
                            className="w-full p-2.5 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] outline-none transition-all"
                        >
                            <option value="">-- Select Subject --</option>
                            {inheritedSubjects.map((sub: any) => (
                                <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                            ))}
                        </select>
                        {errors.subjectId && <p className="text-xs text-red-500">{errors.subjectId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Teacher</label>
                        <select
                            {...form.register("teacherId")}
                            className="w-full p-2.5 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] disabled:bg-[hsl(var(--muted))] disabled:text-[hsl(var(--muted-foreground))] disabled:cursor-not-allowed focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] outline-none transition-all"
                            disabled={isTeacherDisabled}
                        >
                            <option value="" disabled={isTeacherDisabled}>-- Select Teacher --</option>
                            {teachers.map((teach) => (
                                <option key={teach.id} value={teach.id}>{teach.firstName} {teach.lastName}</option>
                            ))}
                        </select>
                        {errors.teacherId && <p className="text-xs text-red-500">{errors.teacherId.message}</p>}
                        {isTeacherDisabled && <p className="text-xs font-semibold text-[hsl(var(--primary))] mt-1">Teacher assigned from curriculum.</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Room</label>
                        <select
                            {...form.register("roomId")}
                            className="w-full p-2.5 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] outline-none transition-all"
                        >
                            <option value="">-- Select Room --</option>
                            {rooms.map((room) => (
                                <option key={room.id} value={room.id}>{room.name} (Cap: {room.capacity})</option>
                            ))}
                        </select>
                        {errors.roomId && <p className="text-xs text-red-500">{errors.roomId.message}</p>}
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-2.5 bg-[hsl(var(--primary))] text-primary-foreground rounded-lg font-medium hover:bg-[hsl(var(--primary-hover))] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Block"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
