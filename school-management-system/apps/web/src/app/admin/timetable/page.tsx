"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Play, Loader2, GripVertical, AlertTriangle } from "lucide-react";
import { DndContext, useDraggable, useDroppable, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { io } from "socket.io-client";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";

const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const timeSlots = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

interface Timeslot {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    roomId: string;
    subject: { name: string; code: string; };
    section: { name: string; id: string; };
    room: { name: string; type: string; capacity: number; id: string; };
    teacher?: { id: string; firstName: string; lastName: string; };
}

interface AcademicYear {
    id: string;
    label: string;
}

// Draggable Slot Component
function DraggableItem({ slot }: { slot: Timeslot }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: slot.id,
        data: { slot }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 999 : 1,
        opacity: isDragging ? 0.8 : 1,
        touchAction: 'none'
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="w-full bg-[hsl(var(--primary))] text-white rounded-md p-1.5 shadow-md flex items-start gap-1 cursor-grab active:cursor-grabbing text-xs border border-transparent hover:border-white/50 transition-all select-none"
        >
            <GripVertical className="w-3 h-3 opacity-50 shrink-0 mt-0.5" />
            <div className="flex-1 overflow-hidden leading-tight">
                <p className="font-bold truncate" title={slot.subject.name}>{slot.subject.code}</p>
                <p className="opacity-90 truncate">{slot.section.name}</p>
                <p className="opacity-75 text-[10px] truncate">{slot.room.name}</p>
            </div>
        </div>
    );
}

// Droppable Cell Component
function DroppableCell({ id, day, time, slots, roomId }: { id: string, day: string, time: string, slots: Timeslot[], roomId: string }) {
    const { isOver, setNodeRef } = useDroppable({
        id: id,
        data: { day, time, roomId }
    });

    return (
        <td
            ref={setNodeRef}
            className={`px-1 py-1 min-w-[120px] transition-colors border-r border-b border-[hsl(var(--border))] ${isOver ? 'bg-[hsl(var(--primary)/0.1)] ring-inset ring-2 ring-[hsl(var(--primary)/0.5)]' : ''}`}
        >
            <div className="min-h-[64px] flex flex-col gap-1 w-full">
                {slots.map(slot => (
                    <DraggableItem key={slot.id} slot={slot} />
                ))}
                {slots.length === 0 && (
                    <div className="w-full h-full min-h-[56px] rounded-md border border-dashed border-[hsl(var(--border))] opacity-30"></div>
                )}
            </div>
        </td>
    );
}

export default function TimetablePage() {
    const [slots, setSlots] = useState<Timeslot[]>([]);
    const [loading, setLoading] = useState(true);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [selectedAyId, setSelectedAyId] = useState("");
    const [filterSection, setFilterSection] = useState("ALL");

    // Modal & Progress
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState("Ready to map subjects to constraints...");
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        api.get("/academic-years").then(res => {
            const ays = res.data.data;
            setAcademicYears(ays);
            if (ays.length > 0) setSelectedAyId(ays[0].id);
        }).catch(() => toast.error("Failed to load academic years"));

        loadTimetable();
    }, []);

    const loadTimetable = () => {
        setLoading(true);
        api.get("/timetable/all")
            .then(res => {
                const fetchedSlots = res.data.data || [];
                // Sort to ensure proper order and handle potential nulls
                setSlots(fetchedSlots);

                if (fetchedSlots.length > 0) {
                    const uniqueSecs = Array.from(new Set(fetchedSlots.map((s: Timeslot) => s.section?.name))).filter(Boolean) as string[];
                    if (uniqueSecs.length > 0 && filterSection === "ALL") {
                        setFilterSection(uniqueSecs[0]);
                    }
                }
            })
            .catch(() => toast.error("Failed to load timetable slots"))
            .finally(() => setLoading(false));
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const draggedSlot = active.data.current?.slot as Timeslot;
        const targetData = over.data.current as { day: string, time: string, roomId: string };

        if (!draggedSlot || !targetData) return;

        // Ensure that slots are dragged to empty or valid spaces.
        const prevSlots = [...slots];
        setSlots(slots.map(s => s.id === draggedSlot.id ? {
            ...s,
            dayOfWeek: targetData.day,
            startTime: targetData.time,
            endTime: `${parseInt(targetData.time.split(':')[0]) + 1}:00`,
            roomId: targetData.roomId || s.roomId
        } : s));

        try {
            await api.post(`/timetable/timeslot/${draggedSlot.id}`, {
                dayOfWeek: targetData.day,
                startTime: targetData.time,
                endTime: `${parseInt(targetData.time.split(':')[0]) + 1}:00`,
                roomId: draggedSlot.roomId,
            });
            toast.success("Timeslot updated successfully");
        } catch (error: any) {
            setSlots(prevSlots);
            toast.error(error.response?.data?.message || "Conflict detected: Overlapping slot for teacher or room.");
        }
    };

    const startGeneration = async () => {
        if (!selectedAyId) return;
        setIsGenerating(true);
        setProgress(5);
        setProgressMessage("Connecting to solver...");

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || "http://localhost:3001";

        // Retrieve token
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

        const socket = io(socketUrl, {
            transports: ["websocket"],
            auth: { token },
            extraHeaders: {
                Authorization: `Bearer ${token}`
            }
        });

        socket.on("timetableProgress", (data: { progress: number, message: string }) => {
            setProgress(data.progress);
            setProgressMessage(data.message);
            if (data.progress === 100) {
                setTimeout(() => {
                    socket.disconnect();
                    setIsGenerating(false);
                    setShowGenerateModal(false);
                    loadTimetable();
                    toast.success("Timetable generation completed!");
                }, 1000);
            }
        });

        try {
            await api.post("/timetable/generate", { academicYearId: selectedAyId });
            setProgress(100);
            setProgressMessage("Completed!");
            setTimeout(() => {
                socket.disconnect();
                setIsGenerating(false);
                setShowGenerateModal(false);
                loadTimetable();
                toast.success("Timetable generation completed!");
            }, 1000);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to generate timetable.");
            socket.disconnect();
            setIsGenerating(false);
        }
    };

    const uniqueSections = Array.from(new Set(slots.map(s => s.section?.name))).filter(Boolean);
    const displaySlots = filterSection === "ALL" ? slots : slots.filter(s => s.section.name === filterSection);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">Constraint-Based Timetable</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        Drag and drop blocks to override automatically generated schedules.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={filterSection}
                        onChange={e => setFilterSection(e.target.value)}
                        className="px-4 py-2 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm font-medium"
                    >
                        <option value="ALL">All Sections</option>
                        {uniqueSections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                    </select>

                    <Button onClick={() => setShowGenerateModal(true)} className="bg-[hsl(var(--primary))] text-white shadow-md rounded-xl">
                        <Play className="w-4 h-4 mr-2" /> Auto Generate Schedule
                    </Button>
                </div>
            </div>

            {/* Drag and Drop Context */}
            <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
                <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                    <div className="overflow-x-auto relative">
                        {loading && (
                            <div className="absolute inset-0 bg-black/5 z-50 flex items-center justify-center backdrop-blur-[1px]">
                                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
                            </div>
                        )}
                        <table className="w-full min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
                                    <th className="w-24 px-4 py-3 text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-left border-r border-[hsl(var(--border))]">
                                        Time
                                    </th>
                                    {days.map((day) => (
                                        <th key={day} className="px-3 py-3 text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-center border-r border-[hsl(var(--border))]">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.map((time) => (
                                    <tr key={time} className="even:bg-[hsl(var(--muted)/0.15)]">
                                        <td className="px-4 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] border-r border-b border-[hsl(var(--border))]">
                                            {time}
                                        </td>
                                        {days.map((day) => {
                                            const cellId = `${day}-${time}`;
                                            const cellSlots = displaySlots.filter(s => s.dayOfWeek === day && s.startTime === time);
                                            return (
                                                <DroppableCell
                                                    key={cellId}
                                                    id={cellId}
                                                    day={day}
                                                    time={time}
                                                    slots={cellSlots}
                                                    roomId={cellSlots[0]?.roomId || ""}
                                                />
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </DndContext>
            </div>

            {/* Generation Progress Modal */}
            <Dialog.Root open={showGenerateModal} onOpenChange={(o) => { if (!isGenerating) setShowGenerateModal(o) }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[hsl(var(--background))] rounded-2xl shadow-xl z-50 border border-[hsl(var(--border))] p-6 flex flex-col gap-6">
                        <div className="space-y-2">
                            <Dialog.Title className="text-xl font-bold">Generate Timetable</Dialog.Title>
                            <Dialog.Description className="text-sm text-[hsl(var(--muted-foreground))]">
                                The CSP Solver will compute a conflict-free schedule.
                            </Dialog.Description>
                        </div>

                        {!isGenerating ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-[hsl(var(--foreground))] mb-1.5 block">Target Academic Year</label>
                                    <select
                                        value={selectedAyId}
                                        onChange={e => setSelectedAyId(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                    >
                                        <option value="" disabled>Select Academic Year</option>
                                        {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.label}</option>)}
                                    </select>
                                </div>
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                        Generating a new schedule will <b>overwrite</b> the existing DRAFT schedule for this academic year. All manual overrides will be lost.
                                    </p>
                                </div>
                                <div className="flex gap-3 justify-end pt-2">
                                    <Button variant="ghost" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
                                    <Button onClick={startGeneration} disabled={!selectedAyId} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-hover))]">
                                        Start Solver <Play className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 flex flex-col items-center py-6 text-center">
                                <div className="relative">
                                    <Loader2 className="w-16 h-16 animate-spin text-[hsl(var(--primary))]/20" />
                                    <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-[hsl(var(--primary))]">
                                        {progress}%
                                    </div>
                                </div>
                                <div className="space-y-2 w-full">
                                    <div className="h-2 w-full bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[hsl(var(--primary))] transition-all duration-300 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-sm font-mono text-[hsl(var(--muted-foreground))] h-5 truncate px-4">
                                        {progressMessage}
                                    </p>
                                </div>
                            </div>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
