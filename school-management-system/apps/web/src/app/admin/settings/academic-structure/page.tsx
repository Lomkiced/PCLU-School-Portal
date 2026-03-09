"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, CalendarRange, GraduationCap, LayoutList } from "lucide-react";
import { motion } from "framer-motion";

import AcademicYearTab from "./components/AcademicYearTab";
import TermSystemTab from "./components/TermSystemTab";
import GradingSystemTab from "./components/GradingSystemTab";
import BreadcrumbNav from "@/components/BreadcrumbNav";

export default function AcademicStructurePage() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex flex-col gap-2">
                <BreadcrumbNav
                    items={[
                        { label: "Admin", href: "/admin" },
                        { label: "Settings", href: "/admin/settings" },
                        { label: "Academic Structure", href: "/admin/settings/academic-structure", active: true }
                    ]}
                />
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Academic Structure</h1>
                        <p className="text-muted-foreground mt-1">
                            Configure the fundamental timeline and grading systems for your institution.
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="academic-year" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="academic-year" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full">
                        <div className="flex items-center gap-2">
                            <CalendarRange className="w-4 h-4" />
                            <span className="font-medium">Academic Year Format</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="term-system" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full">
                        <div className="flex items-center gap-2">
                            <LayoutList className="w-4 h-4" />
                            <span className="font-medium">Term / Semester System</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="grading-system" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            <span className="font-medium">Grading System</span>
                        </div>
                    </TabsTrigger>
                </TabsList>

                <div className="mt-8 relative min-h-[500px]">
                    <TabsContent value="academic-year" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <AcademicYearTab />
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="term-system" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <TermSystemTab />
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="grading-system" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <GradingSystemTab />
                        </motion.div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
