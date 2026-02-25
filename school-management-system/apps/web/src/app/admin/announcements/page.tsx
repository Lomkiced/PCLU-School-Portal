"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pin, Trash2, Clock, Megaphone, Eye, AlertCircle } from "lucide-react";
import { AnnouncementBuilder } from "./components/AnnouncementBuilder";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

const priorityColors: Record<string, "default" | "warning" | "destructive"> = {
    INFO: "default",
    WARNING: "warning",
    URGENT: "destructive",
};

interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: "INFO" | "WARNING" | "URGENT";
    status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
    targetRoles: string[];
    author: { email: string; role: string };
    publishedAt: string | null;
}

export default function AnnouncementsPage() {
    const [showModal, setShowModal] = useState(false);
    const queryClient = useQueryClient();

    // Fetch Announcements
    const { data: response, isLoading } = useQuery({
        queryKey: ["admin-announcements"],
        queryFn: async () => {
            const res = await api.get(`/announcements`);
            return res.data;
        }
    });

    const announcements: Announcement[] = response?.data || [];

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: async (newAnnouncement: any) => {
            const res = await api.post(`/announcements`, newAnnouncement);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
            toast.success("Announcement created successfully");
            setShowModal(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to create announcement");
        }
    });

    // Analytics Component
    const AnalyticsBar = ({ announcementId }: { announcementId: string }) => {
        const { data } = useQuery({
            queryKey: ["announcement-analytics", announcementId],
            queryFn: async () => {
                const res = await api.get(`/announcements/${announcementId}/analytics`);
                return res.data.data;
            },
            refetchInterval: 15000 // Refetch every 15s to see views update
        });

        if (!data) return <div className="text-xs text-[hsl(var(--muted-foreground))]">Loading metrics...</div>;

        const width = `${Math.min(100, data.viewRate)}%`;

        return (
            <div className="flex flex-col gap-1.5 min-w-[150px]">
                <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-[hsl(var(--muted-foreground))]">
                        <Eye className="w-3.5 h-3.5" /> Engagement
                    </span>
                    <span className="font-semibold text-primary">{data.reads} / {data.totalTargeted} views</span>
                </div>
                <div className="h-2 w-full bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                        style={{ width }}
                    />
                </div>
                <div className="text-[10px] text-right text-[hsl(var(--muted-foreground))] font-medium">
                    {data.viewRate.toFixed(1)}% View Rate
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Announcements</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage school-wide targeted communication</p>
                </div>
                <Button size="sm" onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" /> New Announcement
                </Button>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : announcements.length === 0 ? (
                    <div className="text-center p-12 bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))]">
                        <Megaphone className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4 opacity-50" />
                        <h3 className="font-bold">No Announcements Yet</h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Create your first targeted announcement.</p>
                    </div>
                ) : (
                    announcements.map((a) => (
                        <div
                            key={a.id}
                            className={`bg-[hsl(var(--card))] rounded-2xl p-6 shadow-sm border ${a.priority === 'URGENT' ? 'border-red-500/50' : 'border-[hsl(var(--border))]'} hover:shadow-md transition-all`}
                        >
                            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {a.priority === "URGENT" && (
                                            <AlertCircle className="w-4 h-4 text-destructive" />
                                        )}
                                        <h3 className="font-bold text-lg">{a.title}</h3>
                                        <Badge variant={priorityColors[a.priority] || "default"}>
                                            {a.priority}
                                        </Badge>
                                        <Badge variant="outline" className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                                            {a.status}
                                        </Badge>
                                    </div>
                                    <div
                                        className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed line-clamp-2 prose prose-sm dark:prose-invert"
                                        dangerouslySetInnerHTML={{ __html: a.content }}
                                    />
                                    <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))] pt-2">
                                        <span className="font-medium px-2 py-1 bg-primary/10 text-primary rounded-md">By {a.author?.email.split('@')[0]}</span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {a.publishedAt ? format(new Date(a.publishedAt), "MMM d, yyyy h:mm a") : "Not published"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 shrink-0 border-t md:border-t-0 md:border-l border-[hsl(var(--border))] pt-4 md:pt-0 md:pl-6">
                                    <AnalyticsBar announcementId={a.id} />
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors shrink-0">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AnnouncementBuilder
                open={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={(data) => {
                    const payload = {
                        ...data,
                        publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString() : undefined,
                        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
                    };
                    createMutation.mutate(payload);
                }}
            />
        </div>
    );
}
