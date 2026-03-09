"use client";

import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, CalendarIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface GradingPeriodSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    academicYear: any;
    onSaved: () => void;
}

export default function GradingPeriodSheet({ isOpen, onOpenChange, academicYear, onSaved }: GradingPeriodSheetProps) {
    const [periods, setPeriods] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const generateId = () => {
        return typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 15);
    };

    useEffect(() => {
        if (academicYear?.gradingPeriods) {
            setPeriods(academicYear.gradingPeriods.map((p: any) => ({
                id: p.id || generateId(),
                name: p.name,
                weight: p.weight,
                startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : "",
                endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : "",
                dueDate: p.dueDate ? new Date(p.dueDate).toISOString().split('T')[0] : ""
            })));
        } else {
            setPeriods([]);
        }
    }, [academicYear]);

    const addPeriod = () => {
        setPeriods([...periods, {
            id: generateId(),
            name: `Quarter ${periods.length + 1}`,
            weight: 25,
            startDate: "",
            endDate: "",
            dueDate: ""
        }]);
    };

    const removePeriod = (id: string) => {
        setPeriods(periods.filter(p => p.id !== id));
    };

    const updatePeriod = (id: string, field: string, value: any) => {
        setPeriods(periods.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const totalWeight = Number(periods.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0).toFixed(2));
    const isValidSum = totalWeight === 100;

    // Determine progress bar color based on weight
    const getProgressColors = (index: number) => {
        if (isValidSum) return index % 2 === 0 ? "bg-green-500" : "bg-green-400";
        if (totalWeight > 100) return index % 2 === 0 ? "bg-red-500" : "bg-red-400";
        return index % 2 === 0 ? "bg-yellow-500" : "bg-yellow-400";
    };

    const handleSave = async () => {
        if (!isValidSum) {
            toast.error("Total weight must be exactly 100%");
            return;
        }

        // Basic validation
        for (const p of periods) {
            if (!p.name || !p.startDate || !p.endDate || !p.dueDate) {
                toast.error(`Please fill in all fields for ${p.name || 'all periods'}`);
                return;
            }
            if (new Date(p.endDate) <= new Date(p.startDate)) {
                toast.error(`${p.name}: End Date must be after Start Date`);
                return;
            }
            if (new Date(p.dueDate) <= new Date(p.endDate)) {
                toast.error(`${p.name}: Due Date must be after End Date`);
                return;
            }
        }

        setLoading(true);
        try {
            await api.put(`/academic-years/${academicYear.id}/grading-periods`, { periods });
            toast.success("Grading periods updated successfully");
            onSaved();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update grading periods");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl">Configure Grading Periods</SheetTitle>
                    <SheetDescription>
                        Set up the quarters or semesters for {academicYear.name}.
                        The sum of all weights must perfectly total 100%.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Weight Distribution Progress Bar */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold">Weight Distribution</span>
                            <span className={`text-sm font-bold ${isValidSum ? 'text-green-600' : totalWeight > 100 ? 'text-red-500' : 'text-yellow-600'}`}>
                                {totalWeight}% / 100%
                            </span>
                        </div>
                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            {periods.map((p, i) => (
                                <div
                                    key={p.id}
                                    style={{ width: `${Math.min(100, (parseFloat(p.weight) || 0))}%` }}
                                    className={`h-full ${getProgressColors(i)} transition-all border-r border-white/20`}
                                />
                            ))}
                        </div>
                        {!isValidSum && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1 inline" />
                                {totalWeight > 100 ? "Weight limit exceeded by " + (totalWeight - 100) + "%" : "Missing " + (100 - totalWeight) + "% to reach 100%"}
                            </p>
                        )}
                    </div>

                    {/* Periods List */}
                    <div className="space-y-4">
                        {periods.map((period, index) => (
                            <div key={period.id} className="p-4 border rounded-lg bg-card shadow-sm space-y-4 relative">
                                <div className="absolute top-4 right-4 text-slate-400 font-mono text-sm">
                                    #{index + 1}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pr-8">
                                    <div className="md:col-span-3">
                                        <Label>Period Name</Label>
                                        <Input
                                            value={period.name || ""}
                                            onChange={(e: any) => updatePeriod(period.id, 'name', e.target.value)}
                                            placeholder="1st Quarter"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Weight (%)</Label>
                                        <Input
                                            type="number"
                                            min="0" max="100"
                                            value={period.weight ?? ""}
                                            onChange={(e: any) => updatePeriod(period.id, 'weight', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarIcon className="w-3 h-3" /> Start Date</Label>
                                        <Input
                                            type="date"
                                            value={period.startDate || ""}
                                            onChange={(e: any) => updatePeriod(period.id, 'startDate', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarIcon className="w-3 h-3" /> End Date</Label>
                                        <Input
                                            type="date"
                                            value={period.endDate || ""}
                                            onChange={(e: any) => updatePeriod(period.id, 'endDate', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-500 font-semibold"><CalendarIcon className="w-3 h-3" /> Grades Due</Label>
                                        <Input
                                            type="date"
                                            value={period.dueDate || ""}
                                            onChange={(e: any) => updatePeriod(period.id, 'dueDate', e.target.value)}
                                            className="mt-1 border-emerald-500/30 focus-visible:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removePeriod(period.id)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-2"
                                >
                                    <Trash2 className="w-4 h-4 mr-1" /> Remove Period
                                </Button>
                            </div>
                        ))}

                        {periods.length === 0 && (
                            <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                                No grading periods configured yet.
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                        <Button variant="outline" onClick={addPeriod}>
                            <Plus className="w-4 h-4 mr-2" /> Add Period
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button
                                onClick={handleSave}
                                disabled={!isValidSum || loading}
                                className={isValidSum ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                            >
                                {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Configuration</>}
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
