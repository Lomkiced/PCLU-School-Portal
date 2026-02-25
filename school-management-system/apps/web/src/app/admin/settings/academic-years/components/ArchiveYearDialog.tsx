"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface ArchiveYearDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    academicYear: any;
    onConfirm: () => void;
}

export default function ArchiveYearDialog({ isOpen, onOpenChange, academicYear, onConfirm }: ArchiveYearDialogProps) {
    const [confirmText, setConfirmText] = useState("");

    const handleConfirm = () => {
        if (confirmText === academicYear.name) {
            onConfirm();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-red-500/20">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <AlertTriangle className="h-6 w-6" />
                        <DialogTitle>Close & Archive Year</DialogTitle>
                    </div>
                    <DialogDescription>
                        You are about to close and archive the academic year <strong>{academicYear.name}</strong>.
                        This action will lock all records for this year. This cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="confirmText" className="text-sm font-medium mb-2 block">
                        Type <strong>{academicYear.name}</strong> to confirm
                    </Label>
                    <Input
                        id="confirmText"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={academicYear.name}
                        className="border-red-500/50 focus-visible:ring-red-500"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={confirmText !== academicYear.name}
                        onClick={handleConfirm}
                    >
                        Archive Academic Year
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
