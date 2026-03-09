"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Percent, LetterText, Hash, BadgePercent, MessageSquareQuote, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface GradingMethod {
    id: string;
    name: string;
    description: string;
    icon: any;
    enabled: boolean;
    config?: any;
}

export default function GradingSystemTab() {
    const [saving, setSaving] = useState(false);

    // In a real implementation this would fetch from an API
    const [methods, setMethods] = useState<GradingMethod[]>([
        {
            id: "percentage",
            name: "Percentage (0-100%)",
            description: "Standard percentage grading out of 100.",
            icon: Percent,
            enabled: true,
            config: { passingGrade: 75 }
        },
        {
            id: "letter",
            name: "Letter Grades (A-F)",
            description: "Traditional letter representations.",
            icon: LetterText,
            enabled: false
        },
        {
            id: "gpa",
            name: "GPA (0.0 - 4.0)",
            description: "Grade Point Average scale.",
            icon: Hash,
            enabled: false
        },
        {
            id: "cgpa",
            name: "CGPA (Cumulative)",
            description: "Cumulative Grade Point Average.",
            icon: BadgePercent,
            enabled: false
        },
        {
            id: "descriptive",
            name: "Descriptive",
            description: "Excellent, Good, Satisfactory, etc.",
            icon: MessageSquareQuote,
            enabled: false
        }
    ]);

    const handleToggle = (id: string, enabled: boolean) => {
        setMethods(methods.map(m => m.id === id ? { ...m, enabled } : m));
    };

    const handleConfigChange = (id: string, key: string, value: string) => {
        setMethods(methods.map(m => m.id === id ? { ...m, config: { ...m.config, [key]: value } } : m));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Mock API save
            await new Promise(resolve => setTimeout(resolve, 800));
            toast.success("Grading systems configuration saved successfully");
            // API call would go here
        } catch (error) {
            toast.error("Failed to save grading configurations");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-card p-6 rounded-2xl border shadow-sm">
                <div>
                    <h2 className="text-xl font-semibold">Grading Configuration</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Enable and configure the types of grading scales used throughout the institution.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="rounded-xl shadow-md min-w-[120px]">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {methods.map((method) => {
                    const Icon = method.icon;
                    return (
                        <motion.div
                            key={method.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className={`overflow-hidden transition-all duration-300 rounded-2xl border-none shadow-md h-full ${method.enabled ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-card'}`}>
                                <CardContent className="p-0">
                                    <div className="flex items-start justify-between p-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl transition-colors ${method.enabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold">{method.name}</h3>
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{method.description}</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={method.enabled}
                                            onCheckedChange={(checked: boolean) => handleToggle(method.id, checked)}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                    </div>

                                    {method.enabled && method.id === "percentage" && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            className="px-6 pb-6 pt-2 border-t border-primary/10"
                                        >
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground font-semibold">Passing Grade</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={method.config?.passingGrade || 75}
                                                        onChange={(e) => handleConfigChange(method.id, 'passingGrade', e.target.value)}
                                                        className="rounded-xl bg-background border-primary/20 focus-visible:ring-primary pl-4 pr-8"
                                                    />
                                                    <Percent className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {method.enabled && method.id === "letter" && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            className="px-6 pb-6 pt-2 border-t border-primary/10"
                                        >
                                            <div className="text-xs text-muted-foreground">
                                                To customize the letter grading scale ranges (A, B+, B, etc.), <span className="text-primary cursor-pointer hover:underline font-medium">click here</span> to open the scale editor.
                                            </div>
                                        </motion.div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
