"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, Info, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface GlobalNotice {
    id: string;
    title: string;
    message: string;
    type: "INFO" | "WARNING" | "CRITICAL";
    displayMode: "BANNER" | "MODAL";
    requiresAck: boolean;
    ackExpiryDays: number;
}

interface GlobalNoticeProps {
    notice: GlobalNotice | null;
}

const noticeIcons = {
    INFO: Info,
    WARNING: AlertTriangle,
    CRITICAL: AlertCircle,
};

const noticeStyles = {
    INFO: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
    WARNING: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800",
    CRITICAL: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800",
};

export function GlobalNoticeDisplay({ notice }: GlobalNoticeProps) {
    const [dismissed, setDismissed] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (!notice) return;

        // Check localStorage for acknowledgment
        const ackKey = `notice_ack_${notice.id}`;
        const ackData = localStorage.getItem(ackKey);

        if (ackData) {
            const { timestamp } = JSON.parse(ackData);
            const expiryMs = notice.ackExpiryDays * 24 * 60 * 60 * 1000;

            if (Date.now() - timestamp < expiryMs) {
                setDismissed(true);
                return;
            }
        }

        // Show modal if required
        if (notice.displayMode === "MODAL") {
            setModalOpen(true);
        }
    }, [notice]);

    const handleAcknowledge = () => {
        if (!notice) return;

        if (notice.requiresAck) {
            const ackKey = `notice_ack_${notice.id}`;
            localStorage.setItem(ackKey, JSON.stringify({ timestamp: Date.now() }));
        }

        setDismissed(true);
        setModalOpen(false);
    };

    if (!notice || dismissed) return null;

    const Icon = noticeIcons[notice.type];

    // Modal display
    if (notice.displayMode === "MODAL") {
        return (
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            {notice.title}
                        </DialogTitle>
                        <DialogDescription className="text-left whitespace-pre-wrap">
                            {notice.message}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={handleAcknowledge} className="w-full sm:w-auto">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {notice.requiresAck ? "Ho capito" : "Chiudi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    // Banner display
    return (
        <div
            className={cn(
                "fixed top-16 left-0 right-0 z-50 border-b px-4 py-3 transition-all",
                noticeStyles[notice.type]
            )}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-medium">{notice.title}</p>
                        <p className="text-sm opacity-90">{notice.message}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleAcknowledge}
                    className="shrink-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
