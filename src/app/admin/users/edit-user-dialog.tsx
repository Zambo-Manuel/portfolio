"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateUserSchema, type UpdateUserInput } from "@/lib/validations";
import { UserRole, UserStatus } from "@/lib/validations";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ROLE_LABELS } from "@/lib/permissions";

interface User {
    id: string;
    username: string;
    email: string;
    displayName: string;
    role: UserRole;
    status: UserStatus;
}

interface EditUserDialogProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STATUS_LABELS: Record<UserStatus, string> = {
    ACTIVE: "Attivo",
    INACTIVE: "Inattivo",
    SUSPENDED: "Sospeso",
};

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<UpdateUserInput>({
        resolver: zodResolver(updateUserSchema),
    });

    useEffect(() => {
        if (user) {
            reset({
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                status: user.status,
            });
        }
    }, [user, reset]);

    const onSubmit = async (data: UpdateUserInput) => {
        if (!user) return;
        setIsLoading(true);

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Errore durante l'aggiornamento");
            }

            toast.success("Utente aggiornato con successo");
            onOpenChange(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Errore durante l'aggiornamento dell'utente");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Modifica Utente</DialogTitle>
                    <DialogDescription>
                        Modifica i dati di @{user.username}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="displayName">Nome visualizzato</Label>
                        <Input
                            id="displayName"
                            {...register("displayName")}
                        />
                        {errors.displayName && (
                            <p className="text-sm text-red-500">{errors.displayName.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Ruolo</Label>
                        <Select
                            value={watch("role")}
                            onValueChange={(value) => setValue("role", value as UserRole)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleziona ruolo" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Stato</Label>
                        <Select
                            value={watch("status")}
                            onValueChange={(value) => setValue("status", value as UserStatus)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleziona stato" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                            Salva Modifiche
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
