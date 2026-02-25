"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Edit, AlertCircle, CalendarRange, CheckCircle2, ArchiveIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import GradingPeriodSheet from "./components/GradingPeriodSheet";
import ArchiveYearDialog from "./components/ArchiveYearDialog";
import CreateAcademicYearDialog from "./components/CreateAcademicYearDialog";

export default function AcademicYearsSettingsPage() {
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedYear, setSelectedYear] = useState<any | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

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
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Academic Year & Grading Period</h1>
                <p className="text-muted-foreground mt-2">
                    Manage the main timeline backbone for the entire school management system.
                </p>
            </div>

            <Alert className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configuration Guide</AlertTitle>
                <AlertDescription>
                    Only one academic year can be Active at a time. Activating a new year automatically archives the previous one. Ensure Grading Period weights sum to exactly 100%.
                </AlertDescription>
            </Alert>

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Timeline Visualization</h2>
                <Button onClick={() => setIsCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create Academic Year</Button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse h-24 bg-gray-100 dark:bg-gray-800" />
                    ))}
                </div>
            ) : (
                <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-8 pb-4">
                    {academicYears.map((ay, index) => {
                        const isActive = ay.status === 'ACTIVE';
                        const isArchived = ay.status === 'ARCHIVED';
                        const isUpcoming = ay.status === 'UPCOMING';

                        return (
                            <div key={ay.id} className="relative pl-8">
                                <div className={`absolute -left-[11px] top-4 h-5 w-5 rounded-full border-4 border-background ${isActive ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]' : isArchived ? 'bg-slate-400' : 'bg-blue-500'}`} />
                                <Card className={`hover:shadow-md transition-shadow ${isActive ? 'border-green-500/50 dark:border-green-500/30 ring-1 ring-green-500/20' : ''}`}>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-bold">{ay.name}</h3>
                                                    {isActive && <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>}
                                                    {isUpcoming && <Badge variant="info" className="bg-blue-500/10 text-blue-600">Upcoming</Badge>}
                                                    {isArchived && <Badge variant="outline" className="text-slate-500">Archived</Badge>}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <CalendarRange className="h-4 w-4" />
                                                        {format(new Date(ay.startDate), 'MMM d, yyyy')} - {format(new Date(ay.endDate), 'MMM d, yyyy')}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{ay.gradingPeriods?.length || 0} Grading Periods Configured</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!isActive && !isArchived && (
                                                    <Button variant="outline" className="text-green-600 hover:text-green-700" onClick={() => handleActivate(ay.id)}>
                                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Activate
                                                    </Button>
                                                )}
                                                <Button variant="default" onClick={() => { setSelectedYear(ay); setIsSheetOpen(true); }}>
                                                    <Edit className="mr-2 h-4 w-4" /> Configure
                                                </Button>
                                                {isActive && (
                                                    <Button variant="destructive" onClick={() => { setArchiveYear(ay); setIsArchiveOpen(true); }}>
                                                        <ArchiveIcon className="mr-2 h-4 w-4" /> Close & Archive
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedYear && (
                <GradingPeriodSheet
                    isOpen={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                    academicYear={selectedYear}
                    onSaved={fetchAcademicYears}
                />
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
