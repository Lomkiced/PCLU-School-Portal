"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, User, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

interface TimetableSlot {
    id: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    subject: { name: string; code: string };
    room: { name: string };
    teacher: { firstName: string; lastName: string };
    section: { name: string };
}

const DAYS: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function StudentSchedulePage() {
    const { accessToken } = useAuthStore();
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
        (new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase() as DayOfWeek) || "MONDAY"
    );

    useEffect(() => {
        if (!accessToken) return;

        const fetchSchedule = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/timetable/my-schedule`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!res.ok) throw new Error("Failed to fetch schedule data");

                const json = await res.json();
                if (json.success) {
                    setSlots(json.data);
                } else {
                    throw new Error(json.message || "Failed to load schedule");
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [accessToken]);

    // Group and sort slots
    const slotsByDay = slots.reduce((acc, slot) => {
        if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
        acc[slot.dayOfWeek].push(slot);
        return acc;
    }, {} as Record<DayOfWeek, TimetableSlot[]>);

    // Sort slots by start time
    Object.keys(slotsByDay).forEach((day) => {
        slotsByDay[day as DayOfWeek].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    // Helper to generate a consistent color based on subject code
    const getSubjectColor = (code: string) => {
        const colors = [
            "bg-blue-500/10 text-blue-500 border-blue-500/20",
            "bg-purple-500/10 text-purple-500 border-purple-500/20",
            "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            "bg-amber-500/10 text-amber-500 border-amber-500/20",
            "bg-pink-500/10 text-pink-500 border-pink-500/20",
            "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
            "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        ];
        let hash = 0;
        for (let i = 0; i < code.length; i++) {
            hash = code.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--primary))]" />
                <p className="text-[hsl(var(--muted-foreground))] font-medium animate-pulse">Loading your schedule...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4 text-[hsl(var(--destructive))]">
                <AlertCircle className="w-12 h-12" />
                <p className="font-semibold text-lg">Error loading schedule</p>
                <p className="text-sm opacity-80">{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            {/* Header section with modern glass effect */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] p-8 text-white shadow-lg card-shadow-lg">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white/10 rounded-full blur-3xl z-0 pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-black/10 rounded-full blur-2xl z-0 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-3xl font-extrabold tracking-tight mb-2"
                        >
                            My Schedule
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-white/80 font-medium"
                        >
                            View your classes and timetable for the active semester.
                        </motion.p>
                    </div>
                </div>
            </div>

            {/* Day Selector Navigation */}
            <div className="flex overflow-x-auto pb-4 hide-scrollbar snap-x">
                <div className="flex gap-2 mx-auto sm:mx-0 bg-[hsl(var(--card))] p-1.5 rounded-2xl border border-[hsl(var(--border))] shadow-sm">
                    {DAYS.map((day) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={cn(
                                "relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap snap-center",
                                selectedDay === day
                                    ? "text-white shadow-md"
                                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/0.5)]"
                            )}
                        >
                            {selectedDay === day && (
                                <motion.div
                                    layoutId="activeDay"
                                    className="absolute inset-0 bg-[hsl(var(--primary))] rounded-xl -z-10"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            {day.charAt(0) + day.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timetable Grid View */}
            <div className="bg-[hsl(var(--card))] rounded-3xl p-6 md:p-8 card-shadow border border-[hsl(var(--border))] min-h-[400px]">
                {!slotsByDay[selectedDay] || slotsByDay[selectedDay].length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center h-64 text-center space-y-4"
                    >
                        <div className="w-16 h-16 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center mb-2">
                            <Calendar className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
                        </div>
                        <h3 className="text-xl font-bold">No Classes Today</h3>
                        <p className="text-[hsl(var(--muted-foreground))]">You have a free schedule on {selectedDay.toLowerCase()}.</p>
                    </motion.div>
                ) : (
                    <div className="relative pl-4 md:pl-8 border-l-2 border-dashed border-[hsl(var(--muted-foreground)/0.2)]">
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={selectedDay}
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                exit="exit"
                                className="space-y-8"
                            >
                                {slotsByDay[selectedDay].map((slot) => {
                                    const colorClasses = getSubjectColor(slot.subject.code);

                                    return (
                                        <motion.div key={slot.id} variants={itemVariants} className="relative">
                                            {/* Time Marker on the timeline */}
                                            <div className="absolute -left-5 md:-left-9 mt-1.5 w-3 h-3 rounded-full bg-[hsl(var(--background))] border-[3px] border-[hsl(var(--primary))] z-10 ring-4 ring-[hsl(var(--background))]" />

                                            <div className="flex flex-col lg:flex-row gap-4 group">
                                                {/* Time Badge */}
                                                <div className="shrink-0 w-32 pt-0.5">
                                                    <div className="flex items-center gap-1.5 font-bold text-lg tracking-tight">
                                                        <span>{slot.startTime}</span>
                                                    </div>
                                                    <div className="text-sm font-medium text-[hsl(var(--muted-foreground))] mt-0.5">
                                                        to {slot.endTime}
                                                    </div>
                                                </div>

                                                {/* Class Card */}
                                                <div className={cn(
                                                    "flex-1 relative overflow-hidden rounded-2xl border p-5 transition-all duration-300",
                                                    "hover:shadow-md hover:-translate-y-1 group-hover:border-[hsl(var(--primary)/0.3)]",
                                                    colorClasses.split(' ')[0], // Soft background
                                                    "bg-white dark:bg-[hsl(var(--muted)/0.3)] backdrop-blur-md" // Override with glass
                                                )}>
                                                    {/* Decorative subtle gradient background */}
                                                    <div className={cn(
                                                        "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -z-10 -mt-10 -mr-10 transition-transform duration-700 group-hover:scale-150",
                                                        colorClasses.split(' ')[0].replace('/10', '/30')
                                                    )} />

                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge variant="outline" className={cn("font-bold border-2 shadow-sm rounded-lg", colorClasses)}>
                                                                    {slot.subject.code}
                                                                </Badge>
                                                                <Badge variant="default" className="font-medium rounded-lg">
                                                                    {slot.section.name}
                                                                </Badge>
                                                            </div>
                                                            <h3 className="text-xl font-extrabold text-[hsl(var(--foreground))] mb-1">
                                                                {slot.subject.name}
                                                            </h3>
                                                        </div>

                                                        <div className="flex flex-col gap-2 shrink-0">
                                                            <div className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 bg-[hsl(var(--background))] rounded-lg border shadow-sm">
                                                                <MapPin className="w-4 h-4 text-[hsl(var(--primary))]" />
                                                                <span>{slot.room.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 bg-[hsl(var(--background))] rounded-lg border shadow-sm">
                                                                <User className="w-4 h-4 text-[hsl(var(--primary))]" />
                                                                <span>{slot.teacher.firstName} {slot.teacher.lastName}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
