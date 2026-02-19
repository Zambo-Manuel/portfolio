"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { languageSchema, type LanguageInput } from "@/lib/validations";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface Certification {
    id: string;
    title: string;
}

export default function EditLanguagePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [certifications, setCertifications] = useState<Certification[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<LanguageInput>({
        resolver: zodResolver(languageSchema),
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const [langRes, certRes] = await Promise.all([
                    fetch(`/api/languages/${id}`),
                    fetch("/api/certifications?limit=100")
                ]);

                if (!langRes.ok) throw new Error("Lingua non trovata");

                const langData = await langRes.json();
                const certData = await certRes.json();

                setCertifications(certData.data || []);

                reset({
                    name: langData.name,
                    level: langData.level,
                    notes: langData.notes || "",
                    certificationId: langData.certificationId || "",
                    visible: langData.visible,
                    order: langData.order,
                });
            } catch (error) {
                toast.error("Errore durante il caricamento dei dati");
                router.push("/languages");
            } finally {
                setIsFetching(false);
            }
        }

        fetchData();
    }, [id, reset, router]);

    const onSubmit = async (data: LanguageInput) => {
        setIsLoading(true);

        try {
            const res = await fetch(`/api/languages/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || error.message || "Errore durante l'aggiornamento");
            }

            toast.success("Lingua aggiornata con successo");
            router.push("/languages");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Errore durante l'aggiornamento della lingua");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <DashboardShell>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/languages">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Modifica Lingua</h1>
                        <p className="text-muted-foreground">Aggiorna le informazioni della lingua.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Dettagli Lingua</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="lang-name">Nome Lingua *</Label>
                                        <Input
                                            id="lang-name"
                                            placeholder="es. Inglese"
                                            {...register("name")}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-500">{errors.name.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="lang-level">Livello di Competenza *</Label>
                                        <Input
                                            id="lang-level"
                                            placeholder="es. Madrelingua, C2, B2..."
                                            {...register("level")}
                                        />
                                        {errors.level && (
                                            <p className="text-sm text-red-500">{errors.level.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="lang-cert">Certificazione Correlata (opzionale)</Label>
                                        <Select
                                            value={watch("certificationId") || "none"}
                                            onValueChange={(value) => setValue("certificationId", value === "none" ? "" : value)}
                                        >
                                            <SelectTrigger id="lang-cert">
                                                <SelectValue placeholder="Seleziona una certificazione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nessuna</SelectItem>
                                                {certifications.map((cert) => (
                                                    <SelectItem key={cert.id} value={cert.id}>
                                                        {cert.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="lang-notes">Note/Dettagli</Label>
                                        <Textarea
                                            id="lang-notes"
                                            placeholder="Ulteriori dettagli (opzionali)..."
                                            rows={5}
                                            {...register("notes")}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Impostazioni</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="lang-visible">Visibile nel portfolio</Label>
                                        <Switch
                                            id="lang-visible"
                                            checked={watch("visible")}
                                            onCheckedChange={(checked) => setValue("visible", checked)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="lang-order">Ordine</Label>
                                        <Input
                                            id="lang-order"
                                            type="number"
                                            {...register("order", { valueAsNumber: true })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Aggiornamento...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salva Modifiche
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardShell>
    );
}
