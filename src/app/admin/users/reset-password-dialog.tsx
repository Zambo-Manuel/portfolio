"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { resetPasswordSchema } from "@/lib/validations";
import { z } from "zod";
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
import { Loader2, Copy, Check } from "lucide-react";

interface User {
    id: string;
    username: string;
    displayName: string;
}

interface ResetPasswordDialogProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordDialog({
    user,
    open,
    onOpenChange,
}: ResetPasswordDialogProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const newPassword = watch("newPassword");

    const copyToClipboard = async () => {
        if (!newPassword) return;
        await navigator.clipboard.writeText(newPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const onSubmit = async (data: ResetPasswordInput) => {
        if (!user) return;
        setIsLoading(true);

        try {
            const res = await fetch(`/api/users/${user.id}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Errore durante il reset");
            }

            toast.success("Password reimpostata con successo");
            reset();
            onOpenChange(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Errore durante il reset della password");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        Reimposta la password per @{user.username}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nuova Password</Label>
                        <div className="flex gap-2">
                            <Input
                                id="newPassword"
                                type="text"
                                placeholder="Inserisci nuova password"
                                {...register("newPassword")}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={copyToClipboard}
                                disabled={!newPassword}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {errors.newPassword && (
                            <p className="text-sm text-red-500">{errors.newPassword.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Minimo 8 caratteri con almeno una maiuscola, una minuscola e un numero.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Annulla
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reset Password
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
