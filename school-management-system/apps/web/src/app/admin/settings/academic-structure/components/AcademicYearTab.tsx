"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, Plus, CheckCircle2, ArchiveIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import CreateAcademicYearDialog from "./CreateAcademicYearDialog";
import ArchiveYearDialog from "./ArchiveYearDialog";

export default function AcademicYearTab() {
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [archiveYear, setArchiveYear] = useState<any | null>(null);
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchAcademicYears = async () => {
        setLoading(true);
        try {
            const res = await api.get('/academic-years');
            setAcademicYears(res.data.data || []);
        } catch (error) {
            toast.error("Failed to load academic years");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAcademicYears();
    }, []);

    const handleActivate = async (id: string) => {
        try {
            await api.post(`/academic-years/${id}/activate`);
            toast.success("Academic year activated");
            fetchAcademicYears();
        } catch (error) {
            toast.error("Failed to activate academic year");
        }
    };

    const handleCloseArchive = async (id: string) => {
        try {
            await api.post(`/academic-years/${id}/close`);
            toast.success("Academic year archived");
            setIsArchiveOpen(false);
            setArchiveYear(null);
            fetchAcademicYears();
        } catch (error) {
            toast.error("Failed to archive academic year");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-card p-6 rounded-2xl border shadow-sm">
                <div>
                    <h2 className="text-xl font-semibold">Academic Years</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Define the start and end dates of each academic year. Only one year can be active at a time.
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> Create Year
                </Button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <Card key={i} className="animate-pulse h-28 bg-muted rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {academicYears.map((ay) => {
                        const isActive = ay.status === 'ACTIVE';
                        const isArchived = ay.status === 'ARCHIVED';
                        const isUpcoming = ay.status === 'UPCOMING';

                        return (
                            <Card key={ay.id} className={`rounded-2xl overflow-hidden transition-all hover:shadow-md ${isActive ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                                <div className={`h-1 w-full ${isActive ? 'bg-primary' : isArchived ? 'bg-muted-foreground/30' : 'bg-blue-400'}`} />
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-bold">{ay.name}</h3>
                                                {isActive && <Badge className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary">Active</Badge>}
                                                {isUpcoming && <Badge variant="outline" className="bg-blue-500/10 text-blue-600">Upcoming</Badge>}
                                                {isArchived && <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">Archived</Badge>}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                                                <span className="flex items-center gap-2 bg-muted px-3 py-1 rounded-lg">
                                                    <CalendarRange className="h-4 w-4" />
                                                    {format(new Date(ay.startDate), 'MMM d, yyyy')} - {format(new Date(ay.endDate), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!isActive && !isArchived && (
                                                <Button variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl" onClick={() => handleActivate(ay.id)}>
                                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Activate
                                                </Button>
                                            )}
                                            {isActive && (
                                                <Button variant="destructive" className="rounded-xl shadow-sm" onClick={() => { setArchiveYear(ay); setIsArchiveOpen(true); }}>
                                                    <ArchiveIcon className="mr-2 h-4 w-4" /> Close & Archive
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {archiveYear && (
                <ArchiveYearDialog
                    isOpen={isArchiveOpen}
                    onOpenChange={setIsArchiveOpen}
                    academicYear={archiveYear}
                    onConfirm={() => handleCloseArchive(archiveYear.id)}
                />
            )}

            <CreateAcademicYearDialog
                isOpen={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onCreated={fetchAcademicYears}
            />
        </div>
    );
}
