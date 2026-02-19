"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { globalNoticeSchema, type GlobalNoticeInput } from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Eye, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoticeSettingsFormProps {
    initialData: any | null;
}

const noticeTypeConfig = {
    INFO: { icon: Info, color: "text-blue-500" },
    WARNING: { icon: AlertTriangle, color: "text-yellow-500" },
    CRITICAL: { icon: AlertCircle, color: "text-red-500" },
};

export function NoticeSettingsForm({ initialData }: NoticeSettingsFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<GlobalNoticeInput>({
        resolver: zodResolver(globalNoticeSchema),
        defaultValues: {
            title: initialData?.title || "",
            message: initialData?.message || "",
            type: initialData?.type || "INFO",
            active: initialData?.active || false,
            displayMode: initialData?.displayMode || "MODAL",
            requiresAck: initialData?.requiresAck || false,
            startAt: initialData?.startAt ? new Date(initialData.startAt).toISOString().slice(0, 16) : "",
            endAt: initialData?.endAt ? new Date(initialData.endAt).toISOString().slice(0, 16) : "",
            ackExpiryDays: initialData?.ackExpiryDays || 7,
        },
    });

    const onSubmit = async (data: GlobalNoticeInput) => {
        setIsLoading(true);

        try {
            const res = await fetch("/api/settings/notice", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Errore durante il salvataggio");
            }

            toast.success("Avviso salvato con successo");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Errore durante il salvataggio");
        } finally {
            setIsLoading(false);
        }
    };

    const currentType = watch("type") as keyof typeof noticeTypeConfig;
    const TypeIcon = noticeTypeConfig[currentType]?.icon || Info;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contenuto Avviso</CardTitle>
                            <CardDescription>
                                Il messaggio che verrà mostrato ai visitatori.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Titolo *</Label>
                                <Input
                                    id="title"
                                    placeholder="es. Manutenzione programmata"
                                    {...register("title")}
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-500">{errors.title.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Messaggio *</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Scrivi il messaggio dell'avviso..."
                                    rows={4}
                                    {...register("message")}
                                />
                                {errors.message && (
                                    <p className="text-sm text-red-500">{errors.message.message}</p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <Select
                                        value={watch("type")}
                                        onValueChange={(value) => setValue("type", value as any)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INFO">
                                                <div className="flex items-center gap-2">
                                                    <Info className="h-4 w-4 text-blue-500" />
                                                    Informazione
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="WARNING">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                                    Avviso
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="CRITICAL">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                                    Critico
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Modalità Visualizzazione</Label>
                                    <Select
                                        value={watch("displayMode")}
                                        onValueChange={(value) => setValue("displayMode", value as any)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BANNER">Banner (in alto)</SelectItem>
                                            <SelectItem value="MODAL">Modal (popup)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pianificazione</CardTitle>
                            <CardDescription>
                                Imposta date di inizio e fine per l'avviso (opzionale).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="startAt">Data Inizio</Label>
                                    <Input
                                        id="startAt"
                                        type="datetime-local"
                                        {...register("startAt")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="endAt">Data Fine</Label>
                                    <Input
                                        id="endAt"
                                        type="datetime-local"
                                        {...register("endAt")}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Stato</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="active">Attivo</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Mostra l'avviso ai visitatori
                                    </p>
                                </div>
                                <Switch
                                    id="active"
                                    checked={watch("active")}
                                    onCheckedChange={(checked) => setValue("active", checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="requiresAck">Richiedi conferma</Label>
                                    <p className="text-sm text-muted-foreground">
                                        L'utente deve confermare
                                    </p>
                                </div>
                                <Switch
                                    id="requiresAck"
                                    checked={watch("requiresAck")}
                                    onCheckedChange={(checked) => setValue("requiresAck", checked)}
                                />
                            </div>

                            {watch("requiresAck") && (
                                <div className="space-y-2">
                                    <Label htmlFor="ackExpiryDays">Scadenza conferma (giorni)</Label>
                                    <Input
                                        id="ackExpiryDays"
                                        type="number"
                                        min="1"
                                        max="365"
                                        {...register("ackExpiryDays", { valueAsNumber: true })}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Anteprima
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowPreview(!showPreview)}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        {showPreview && (
                            <CardContent>
                                <div className={cn(
                                    "p-3 rounded-lg border flex items-start gap-2",
                                    currentType === "INFO" && "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
                                    currentType === "WARNING" && "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
                                    currentType === "CRITICAL" && "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
                                )}>
                                    <TypeIcon className={cn("h-5 w-5 mt-0.5", noticeTypeConfig[currentType]?.color)} />
                                    <div>
                                        <p className="font-medium text-sm">{watch("title") || "Titolo"}</p>
                                        <p className="text-sm opacity-80">{watch("message") || "Messaggio..."}</p>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvataggio...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salva Avviso
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
}
