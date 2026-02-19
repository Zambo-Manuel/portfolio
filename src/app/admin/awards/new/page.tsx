"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { awardSchema, type AwardInput } from "@/lib/validations";
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
import { Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NewAwardPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<AwardInput>({
        resolver: zodResolver(awardSchema),
        defaultValues: {
            status: "DRAFT",
            order: 0,
            tags: [],
        },
    });

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

    const onSubmit = async (data: AwardInput) => {
        setIsLoading(true);

        try {
            const res = await fetch("/api/awards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    tags,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || error.message || "Errore durante la creazione");
            }

            toast.success("Riconoscimento creato con successo");
            router.push("/awards");
        } catch (error: any) {
            toast.error(error.message || "Errore durante la creazione del riconoscimento");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/awards">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Nuovo Riconoscimento</h1>
                        <p className="text-muted-foreground">Aggiungi un nuovo premio o riconoscimento.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Dettagli Riconoscimento</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Titolo *</Label>
                                        <Input
                                            id="title"
                                            placeholder="es. Miglior Sviluppatore dell'Anno"
                                            {...register("title")}
                                        />
                                        {errors.title && (
                                            <p className="text-sm text-red-500">{errors.title.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="issuer">Ente *</Label>
                                        <Input
                                            id="issuer"
                                            placeholder="es. Google Developers"
                                            {...register("issuer")}
                                        />
                                        {errors.issuer && (
                                            <p className="text-sm text-red-500">{errors.issuer.message}</p>
                                        )}
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
                                            placeholder="Descrivi il riconoscimento..."
                                            rows={5}
                                            {...register("description")}
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
                                        <Label htmlFor="awardedAt">Data Riconoscimento *</Label>
                                        <Input
                                            id="awardedAt"
                                            type="date"
                                            {...register("awardedAt")}
                                        />
                                        {errors.awardedAt && (
                                            <p className="text-sm text-red-500">{errors.awardedAt.message}</p>
                                        )}
                                    </div>
                                </CardContent>
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
                                        Salva Riconoscimento
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
