"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, CalendarIcon, Loader2, Save, LayoutList } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

type TermPreset = "QUARTERLY" | "TRIMESTER" | "SEMESTER" | "CUSTOM";

export default function TermSystemTab() {
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>("");
    const [loadingYears, setLoadingYears] = useState(true);

    // Form states
    const [preset, setPreset] = useState<TermPreset>("QUARTERLY");
    const [periods, setPeriods] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAcademicYears();
    }, []);

    const fetchAcademicYears = async () => {
        setLoadingYears(true);
        try {
            const res = await api.get('/academic-years');
            const data = res.data.data || [];
            setAcademicYears(data);
            const active = data.find((y: any) => y.status === "ACTIVE");
            if (active) {
                setSelectedYearId(active.id);
                loadPeriods(active);
            } else if (data.length > 0) {
                setSelectedYearId(data[0].id);
                loadPeriods(data[0]);
            }
        } catch (error) {
            toast.error("Failed to load academic years");
        } finally {
            setLoadingYears(false);
        }
    };

    const loadPeriods = (year: any) => {
        if (year?.gradingPeriods?.length > 0) {
            setPeriods(year.gradingPeriods.map((p: any) => ({
                id: p.id || generateId(),
                name: p.name,
                weight: p.weight,
                startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : "",
                endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : "",
                dueDate: p.dueDate ? new Date(p.dueDate).toISOString().split('T')[0] : ""
            })));

            // Guess preset
            const len = year.gradingPeriods.length;
            if (len === 2) setPreset("SEMESTER");
            else if (len === 3) setPreset("TRIMESTER");
            else if (len === 4) setPreset("QUARTERLY");
            else setPreset("CUSTOM");
        } else {
            setPeriods([]);
            setPreset("QUARTERLY"); // Default
        }
    };

    const handleYearChange = (val: string) => {
        setSelectedYearId(val);
        const year = academicYears.find(y => y.id === val);
        if (year) loadPeriods(year);
    };

    const generateId = () => Math.random().toString(36).substring(2, 9);

    const applyPreset = (type: TermPreset) => {
        setPreset(type);
        const year = academicYears.find(y => y.id === selectedYearId);
        if (!year) return;

        let count = 4;
        let pName = "Quarter";
        if (type === "SEMESTER") { count = 2; pName = "Semester"; }
        if (type === "TRIMESTER") { count = 3; pName = "Trimester"; }
        if (type === "CUSTOM") return; // Leave as is

        const weight = (100 / count).toFixed(2);

        const newPeriods = Array.from({ length: count }).map((_, i) => ({
            id: generateId(),
            name: `${i + 1}${['st', 'nd', 'rd'][i] || 'th'} ${pName}`,
            weight,
            startDate: "",
            endDate: "",
            dueDate: ""
        }));

        setPeriods(newPeriods);
    };

    const totalWeight = Number(periods.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0).toFixed(2));
    const isValidSum = totalWeight === 100;

    const handleSave = async () => {
        if (!selectedYearId) return;
        if (!isValidSum) return toast.error("Total weight must be exactly 100%");

        for (const p of periods) {
            if (!p.name || !p.startDate || !p.endDate || !p.dueDate) {
                return toast.error(`Please fill in all dates for ${p.name}`);
            }
        }

        setSaving(true);
        try {
            await api.put(`/academic-years/${selectedYearId}/grading-periods`, { periods });
            toast.success("Term system saved successfully");
            fetchAcademicYears(); // Refresh
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const updatePeriod = (id: string, field: string, value: any) => {
        setPeriods(periods.map(p => p.id === id ? { ...p, [field]: value } : p));
        setPreset("CUSTOM"); // Any manual change switches to custom
    };

    const periodCountMap = { "QUARTERLY": 4, "TRIMESTER": 3, "SEMESTER": 2, "CUSTOM": "Custom" };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 border-none shadow-md rounded-2xl bg-gradient-to-br from-card to-muted/20">
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <LayoutList className="w-5 h-5 text-primary" /> System Setup
                            </h2>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Select the academic year and the term structure. Presets will auto-generate the periods for you.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Target Academic Year</Label>
                                <Select value={selectedYearId} onValueChange={handleYearChange} disabled={loadingYears}>
                                    <SelectTrigger className="w-full h-11 rounded-xl bg-background">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {academicYears.map(y => (
                                            <SelectItem key={y.id} value={y.id}>
                                                {y.name} {y.status === "ACTIVE" ? "(Active)" : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Term Preset</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(["QUARTERLY", "TRIMESTER", "SEMESTER"] as TermPreset[]).map((t) => (
                                        <Button
                                            key={t}
                                            variant={preset === t ? "default" : "outline"}
                                            className={`rounded-xl h-auto py-3 justify-start flex-col items-start gap-1 transition-all ${preset === t ? "shadow-md ring-2 ring-primary/20" : "bg-background hover:bg-muted"}`}
                                            onClick={() => applyPreset(t)}
                                        >
                                            <span className="font-semibold">{t.charAt(0) + t.slice(1).toLowerCase()}</span>
                                            <span className="text-xs opacity-80 font-normal">{periodCountMap[t]} Terms</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border/50">
                            <Button
                                className="w-full rounded-xl h-11 font-semibold shadow-md transition-all"
                                onClick={handleSave}
                                disabled={saving || !selectedYearId || !isValidSum}
                            >
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Term Configuration
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="col-span-1 md:col-span-2 space-y-4">
                    <div className="bg-card p-4 rounded-2xl border shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-sm font-bold block mb-1">Weight Distribution</span>
                            <div className="h-2 w-48 bg-muted rounded-full overflow-hidden flex">
                                {periods.map((p, i) => (
                                    <div
                                        key={p.id}
                                        style={{ width: `${Math.min(100, (parseFloat(p.weight) || 0))}%` }}
                                        className={`h-full transition-all border-r border-background/50 ${isValidSum ? 'bg-primary' : totalWeight > 100 ? 'bg-destructive' : 'bg-yellow-500'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold bg-muted ${isValidSum ? 'text-primary' : totalWeight > 100 ? 'text-destructive' : 'text-yellow-600'}`}>
                            {totalWeight}% / 100%
                        </span>
                    </div>

                    {!selectedYearId ? (
                        <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-2xl text-muted-foreground bg-card/50">
                            Select an Academic Year first
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {periods.map((period, index) => (
                                <Card key={period.id} className="rounded-2xl border-none shadow-sm overflow-hidden bg-card">
                                    <div className="h-1 w-full bg-primary/20" />
                                    <CardContent className="p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="md:col-span-2 space-y-1.5">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Period Name</Label>
                                                <Input
                                                    value={period.name || ""}
                                                    onChange={(e: any) => updatePeriod(period.id, 'name', e.target.value)}
                                                    className="rounded-xl h-10 border-muted-foreground/20 bg-muted/30 focus-visible:bg-background"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Weight (%)</Label>
                                                <Input
                                                    type="number" min="0" max="100"
                                                    value={period.weight ?? ""}
                                                    onChange={(e: any) => updatePeriod(period.id, 'weight', e.target.value)}
                                                    className="rounded-xl h-10 border-muted-foreground/20 bg-muted/30 focus-visible:bg-background"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Grades Due</Label>
                                                <Input
                                                    type="date"
                                                    value={period.dueDate || ""}
                                                    onChange={(e: any) => updatePeriod(period.id, 'dueDate', e.target.value)}
                                                    className="rounded-xl h-10 border-emerald-500/30 focus-visible:bg-background text-emerald-600 dark:text-emerald-400"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Start Date</Label>
                                                <Input
                                                    type="date"
                                                    value={period.startDate || ""}
                                                    onChange={(e: any) => updatePeriod(period.id, 'startDate', e.target.value)}
                                                    className="rounded-xl h-10 bg-muted/30"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> End Date</Label>
                                                <Input
                                                    type="date"
                                                    value={period.endDate || ""}
                                                    onChange={(e: any) => updatePeriod(period.id, 'endDate', e.target.value)}
                                                    className="rounded-xl h-10 bg-muted/30"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
