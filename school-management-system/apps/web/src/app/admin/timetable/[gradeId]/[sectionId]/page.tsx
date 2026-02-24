"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, AlertCircle, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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

export default function ScheduleBuilderPage() {
    const params = useParams();
    const gradeId = params.gradeId as string;
    const sectionId = params.sectionId as string;

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
            // The API returns the subject with its base properties, so the ID we want to match is `s.id`
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

    const fetchData = async () => {
        setLoading(true);
        try {
            const [secRes, tsRes, teachRes, roomRes, ayRes, inheritedRes] = await Promise.all([
                api.get(`/sections/${sectionId}`),
                api.get(`/timetable/section/${sectionId}`),
                api.get(`/teachers`), // teachers
                api.get(`/rooms`),
                api.get(`/academic-years`),
                api.get(`/sections/${sectionId}/subjects`)
            ]);

            setSection(secRes.data.data);
            setTimeslots(tsRes.data.data || []);
            setTeachers(teachRes.data.data?.data || teachRes.data.data || []);
            setRooms(roomRes.data.data || []);
            setActiveAy(ayRes.data.data?.find((ay: any) => ay.isActive) || ayRes.data.data?.[0]);
            setInheritedSubjects(inheritedRes.data.data || []);
            // Debug the inherited subjects mapping
            console.log("Inherited Subjects Mapping:", inheritedRes.data.data);
        } catch (err) {
            setError("Failed to load schedule data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (sectionId) fetchData();
    }, [sectionId]);

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
            toast.error(error.response?.data?.message || "Failed to add timeslot. Conflict detected.");
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
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        );
    }

    if (error || !section) {
        return (
            <div className="flex items-center justify-center h-64 gap-3 text-[hsl(var(--destructive))]">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">{error || "Section not found"}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/admin/timetable/${gradeId}`}
                        className="p-2 -ml-2 rounded-xl hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold">Schedule Builder: {section.name}</h2>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                            Manually assign classes and resolve conflicts
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => handleAddClick("MONDAY", "07:00")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary-hover))] transition-all shadow-md shadow-[hsl(var(--primary)/0.25)]"
                >
                    <Plus className="w-4 h-4" /> Add Block
                </button>
            </div>

            {/* Weekly Grid */}
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm text-left">
                    <thead className="bg-[hsl(var(--muted)/0.5)] border-b border-[hsl(var(--border))]">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))] w-24">Time</th>
                            {DAYS.map((day) => (
                                <th key={day} className="px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))] text-center border-l border-[hsl(var(--border))]">
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(var(--border))]">
                        {HOURS.map((hour) => (
                            <tr key={hour} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                                <td className="px-4 py-4 font-medium text-[hsl(var(--muted-foreground))] align-top">
                                    {hour}
                                </td>
                                {DAYS.map((day) => {
                                    // Find slot for this day and time
                                    const slot = timeslots.find(t => t.dayOfWeek === day && t.startTime === hour);

                                    return (
                                        <td key={day} className="p-2 border-l border-[hsl(var(--border))] align-top h-24 w-[18%]">
                                            {slot ? (
                                                <div className="group relative bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.2)] rounded-xl p-3 h-full flex flex-col justify-between hover:bg-[hsl(var(--primary)/0.15)] transition-colors">
                                                    <div>
                                                        <p className="font-bold text-[hsl(var(--foreground))] text-xs truncate">
                                                            {slot.subject.name}
                                                        </p>
                                                        <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate mt-0.5">
                                                            {slot.teacher.firstName} {slot.teacher.lastName}
                                                        </p>
                                                        <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                                                            Room: {slot.room.name}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteBlock(slot.id)}
                                                        className="absolute top-2 right-2 p-1.5 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full border-2 border-dashed border-[hsl(var(--border)/0.5)] rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleAddClick(day, hour)}
                                                        className="text-xs font-semibold text-[hsl(var(--primary))] flex items-center gap-1"
                                                    >
                                                        <Plus className="w-3 h-3" /> Add
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Block Modal */}
            <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Class Block">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Day</label>
                            <select
                                {...form.register("dayOfWeek")}
                                className="w-full p-2 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] focus:border-[hsl(var(--primary))] outline-none"
                            >
                                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            {errors.dayOfWeek && <p className="text-xs text-red-500">{errors.dayOfWeek.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Start Time</label>
                            <select
                                {...form.register("startTime")}
                                className="w-full p-2 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] focus:border-[hsl(var(--primary))] outline-none"
                            >
                                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            {errors.startTime && <p className="text-xs text-red-500">{errors.startTime.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">End Time</label>
                            <select
                                {...form.register("endTime")}
                                className="w-full p-2 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] focus:border-[hsl(var(--primary))] outline-none"
                            >
                                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            {errors.endTime && <p className="text-xs text-red-500">{errors.endTime.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Subject</label>
                        <select
                            {...form.register("subjectId")}
                            className="w-full p-2 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] focus:border-[hsl(var(--primary))] outline-none"
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
                            className="w-full p-2 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] disabled:bg-[hsl(var(--muted))] disabled:text-[hsl(var(--muted-foreground))] disabled:cursor-not-allowed focus:border-[hsl(var(--primary))] outline-none"
                            disabled={isTeacherDisabled}
                        >
                            <option value="" disabled={isTeacherDisabled}>-- Select Teacher --</option>
                            {teachers.map((teach) => (
                                <option key={teach.id} value={teach.id}>{teach.firstName} {teach.lastName}</option>
                            ))}
                        </select>
                        {errors.teacherId && <p className="text-xs text-red-500">{errors.teacherId.message}</p>}
                        {isTeacherDisabled && <p className="text-xs font-semibold text-[hsl(var(--primary))]">Teacher locked from inherit assignment.</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Room</label>
                        <select
                            {...form.register("roomId")}
                            className="w-full p-2 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] focus:border-[hsl(var(--primary))] outline-none"
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
                            className="w-full py-2.5 bg-[hsl(var(--primary))] text-white rounded-xl font-medium hover:bg-[hsl(var(--primary-hover))] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Block"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
