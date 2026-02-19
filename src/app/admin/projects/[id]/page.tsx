"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { projectSchema, type ProjectInput, ContentStatus } from "@/lib/validations";
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

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [tags, setTags] = useState<string[]>([]);
    const [techStack, setTechStack] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [techInput, setTechInput] = useState("");

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<ProjectInput>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            status: "DRAFT",
            featured: false,
            order: 0,
            tags: [],
            techStack: [],
            images: [],
        },
    });

    useEffect(() => {
        async function fetchProject() {
            try {
                const res = await fetch(`/api/projects/${id}`);
                if (!res.ok) throw new Error("Progetto non trovato");

                const data = await res.json();

                // Set form values
                reset({
                    title: data.title,
                    slug: data.slug,
                    mainLink: data.mainLink,
                    description: data.description || "",
                    repoLink: data.repoLink || "",
                    roleActivities: data.roleActivities || "",
                    results: data.results || "",
                    status: data.status as ContentStatus,
                    featured: data.featured,
                    order: data.order,
                    startDate: data.startDate ? format(new Date(data.startDate), "yyyy-MM-dd") : "",
                    endDate: data.endDate ? format(new Date(data.endDate), "yyyy-MM-dd") : "",
                    tags: data.tags,
                    techStack: data.techStack,
                    images: data.images,
                });

                setTags(data.tags);
                setTechStack(data.techStack);
            } catch (error) {
                toast.error("Errore durante il caricamento del progetto");
                router.push("/projects");
            } finally {
                setIsFetching(false);
            }
        }

        fetchProject();
    }, [id, reset, router]);

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    };

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

    const handleAddTech = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && techInput.trim()) {
            e.preventDefault();
            const newTech = [...techStack, techInput.trim()];
            setTechStack(newTech);
            setValue("techStack", newTech);
            setTechInput("");
        }
    };

    const handleRemoveTech = (index: number) => {
        const newTech = techStack.filter((_, i) => i !== index);
        setTechStack(newTech);
        setValue("techStack", newTech);
    };

    const onSubmit = async (data: ProjectInput) => {
        setIsLoading(true);

        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    tags,
                    techStack,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || error.message || "Errore durante l'aggiornamento");
            }

            toast.success("Progetto aggiornato con successo");
            router.push("/projects");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Errore durante l'aggiornamento del progetto");
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
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/admin/projects">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Modifica Progetto</h1>
                            <p className="text-muted-foreground">Aggiorna le informazioni del progetto.</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informazioni Generali</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Titolo *</Label>
                                        <Input
                                            id="title"
                                            placeholder="es. Portfolio Website"
                                            {...register("title", {
                                                onChange: (e) => {
                                                    // Only auto-update slug if needed, usually on edit we keep it stable unless explicitly changed
                                                },
                                            })}
                                        />
                                        {errors.title && (
                                            <p className="text-sm text-red-500">{errors.title.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="slug">Slug *</Label>
                                        <Input
                                            id="slug"
                                            placeholder="es. portfolio-website"
                                            {...register("slug")}
                                        />
                                        {errors.slug && (
                                            <p className="text-sm text-red-500">{errors.slug.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="mainLink">Link Principale *</Label>
                                        <Input
                                            id="mainLink"
                                            type="url"
                                            placeholder="https://example.com"
                                            {...register("mainLink")}
                                        />
                                        {errors.mainLink && (
                                            <p className="text-sm text-red-500">{errors.mainLink.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="repoLink">Link Repository (opzionale)</Label>
                                        <Input
                                            id="repoLink"
                                            type="url"
                                            placeholder="https://github.com/..."
                                            {...register("repoLink")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Descrizione</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Descrivi il progetto..."
                                            rows={5}
                                            {...register("description")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="roleActivities">Ruolo/Attività</Label>
                                        <Textarea
                                            id="roleActivities"
                                            placeholder="Il tuo ruolo nel progetto..."
                                            rows={3}
                                            {...register("roleActivities")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="results">Risultati/Metriche</Label>
                                        <Textarea
                                            id="results"
                                            placeholder="Risultati ottenuti..."
                                            rows={3}
                                            {...register("results")}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Tags e Tecnologie</CardTitle>
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

                                    <div className="space-y-2">
                                        <Label>Tech Stack</Label>
                                        <Input
                                            placeholder="Premi Enter per aggiungere..."
                                            value={techInput}
                                            onChange={(e) => setTechInput(e.target.value)}
                                            onKeyDown={handleAddTech}
                                        />
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {techStack.map((tech, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md text-sm cursor-pointer hover:opacity-80"
                                                    onClick={() => handleRemoveTech(i)}
                                                >
                                                    {tech} ×
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
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
                                        <Label htmlFor="featured">In evidenza</Label>
                                        <Switch
                                            id="featured"
                                            checked={watch("featured")}
                                            onCheckedChange={(checked) => setValue("featured", checked)}
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
                                        <Label htmlFor="startDate">Data Inizio</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            {...register("startDate")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">Data Fine</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            {...register("endDate")}
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
