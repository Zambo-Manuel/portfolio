"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { volunteeringSchema, type VolunteeringInput, ContentStatus } from "@/lib/validations";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function EditVolunteeringPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<VolunteeringInput>({
        resolver: zodResolver(volunteeringSchema),
        defaultValues: {
            status: "DRAFT",
            isCurrent: false,
            order: 0,
            tags: [],
        },
    });

    useEffect(() => {
        async function fetchVolunteering() {
            try {
                const res = await fetch(`/api/volunteering/${id}`);
                if (!res.ok) throw new Error("Esperienza non trovata");

                const data = await res.json();

                // Set form values
                reset({
                    organization: data.organization,
                    role: data.role,
                    location: data.location || "",
                    link: data.link || "",
                    description: data.description || "",
                    impact: data.impact || "",
                    status: data.status as ContentStatus,
                    isCurrent: data.isCurrent,
                    order: data.order,
                    startDate: data.startDate ? format(new Date(data.startDate), "yyyy-MM-dd") : "",
                    endDate: data.endDate ? format(new Date(data.endDate), "yyyy-MM-dd") : "",
                    tags: data.tags,
                });

                setTags(data.tags);
            } catch (error) {
                toast.error("Errore durante il caricamento dell'esperienza");
                router.push("/volunteering");
            } finally {
                setIsFetching(false);
            }
        }

        fetchVolunteering();
    }, [id, reset, router]);

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            const newTags = [...tags, tagInput.trim()];
            setTags(newTags);
            setValue("tags", newTags);
            setTagInput("");
        }
    };

    const handleRemoveTag = (index: number) => {
        const newTags = tags.filter((_, i) => i !== index);
        setTags(newTags);
        setValue("tags", newTags);
    };

    const onSubmit = async (data: VolunteeringInput) => {
        setIsLoading(true);

        try {
            const res = await fetch(`/api/volunteering/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    tags,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || error.message || "Errore durante l'aggiornamento");
            }

            toast.success("Esperienza aggiornata con successo");
            router.push("/volunteering");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Errore durante l'aggiornamento dell'esperienza");
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

    const isCurrent = watch("isCurrent");

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/volunteering">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Modifica Esperienza</h1>
                        <p className="text-muted-foreground">Aggiorna le informazioni dell'esperienza di volontariato.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informazioni Esperienza</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="organization">Organizzazione *</Label>
                                        <Input
                                            id="organization"
                                            placeholder="es. Croce Rossa Italiana"
                                            {...register("organization")}
                                        />
                                        {errors.organization && (
                                            <p className="text-sm text-red-500">{errors.organization.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="role">Ruolo *</Label>
                                        <Input
                                            id="role"
                                            placeholder="es. Volontario Soccorritore"
                                            {...register("role")}
                                        />
                                        {errors.role && (
                                            <p className="text-sm text-red-500">{errors.role.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="location">Luogo</Label>
                                        <Input
                                            id="location"
                                            placeholder="es. Milano, Italia"
                                            {...register("location")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="link">Link (opzionale)</Label>
                                        <Input
                                            id="link"
                                            type="url"
                                            placeholder="https://..."
                                            {...register("link")}
                                        />
                                        {errors.link && (
                                            <p className="text-sm text-red-500">{errors.link.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Descrizione</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Descrivi le tue attività..."
                                            rows={5}
                                            {...register("description")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="impact">Impatto/Risultati</Label>
                                        <Textarea
                                            id="impact"
                                            placeholder="L'impatto del tuo lavoro..."
                                            rows={3}
                                            {...register("impact")}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Tags</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Tags</Label>
                                        <Input
                                            placeholder="Premi Enter per aggiungere..."
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleAddTag}
                                        />
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {tags.map((tag, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm cursor-pointer hover:bg-primary/20"
                                                    onClick={() => handleRemoveTag(i)}
                                                >
                                                    {tag} ×
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pubblicazione</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Stato</Label>
                                        <Select
                                            value={watch("status")}
                                            onValueChange={(value) => setValue("status", value as any)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DRAFT">Bozza</SelectItem>
                                                <SelectItem value="PUBLISHED">Pubblicato</SelectItem>
                                                <SelectItem value="ARCHIVED">Archiviato</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="isCurrent">Attività in corso</Label>
                                        <Switch
                                            id="isCurrent"
                                            checked={watch("isCurrent")}
                                            onCheckedChange={(checked) => setValue("isCurrent", checked)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="order">Ordine</Label>
                                        <Input
                                            id="order"
                                            type="number"
                                            {...register("order", { valueAsNumber: true })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Date</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Data Inizio *</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            {...register("startDate")}
                                        />
                                        {errors.startDate && (
                                            <p className="text-sm text-red-500">{errors.startDate.message}</p>
                                        )}
                                    </div>

                                    {!isCurrent && (
                                        <div className="space-y-2">
                                            <Label htmlFor="endDate">Data Fine</Label>
                                            <Input
                                                id="endDate"
                                                type="date"
                                                {...register("endDate")}
                                            />
                                        </div>
                                    )}
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
