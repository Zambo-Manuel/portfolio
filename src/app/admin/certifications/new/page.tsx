"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { certificationSchema, type CertificationInput } from "@/lib/validations";
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

export default function NewCertificationPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState("");

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CertificationInput>({
        resolver: zodResolver(certificationSchema),
        defaultValues: {
            status: "DRAFT",
            order: 0,
            skills: [],
        },
    });

    const handleAddSkill = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && skillInput.trim()) {
            e.preventDefault();
            const newSkills = [...skills, skillInput.trim()];
            setSkills(newSkills);
            setValue("skills", newSkills);
            setSkillInput("");
        }
    };

    const handleRemoveSkill = (index: number) => {
        const newSkills = skills.filter((_, i) => i !== index);
        setSkills(newSkills);
        setValue("skills", newSkills);
    };

    const onSubmit = async (data: CertificationInput) => {
        setIsLoading(true);

        try {
            const res = await fetch("/api/certifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    skills,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || error.message || "Errore durante la creazione");
            }

            toast.success("Certificazione creata con successo");
            router.push("/certifications");
        } catch (error: any) {
            toast.error(error.message || "Errore durante la creazione della certificazione");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/certifications">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Nuova Certificazione</h1>
                        <p className="text-muted-foreground">Aggiungi una nuova certificazione o attestato.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Dettagli Certificazione</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Titolo *</Label>
                                        <Input
                                            id="title"
                                            placeholder="es. AWS Certified Solutions Architect"
                                            {...register("title")}
                                        />
                                        {errors.title && (
                                            <p className="text-sm text-red-500">{errors.title.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="issuer">Ente Rilasciante *</Label>
                                        <Input
                                            id="issuer"
                                            placeholder="es. Amazon Web Services"
                                            {...register("issuer")}
                                        />
                                        {errors.issuer && (
                                            <p className="text-sm text-red-500">{errors.issuer.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="verificationLink">Link di Verifica</Label>
                                        <Input
                                            id="verificationLink"
                                            type="url"
                                            placeholder="https://..."
                                            {...register("verificationLink")}
                                        />
                                        {errors.verificationLink && (
                                            <p className="text-sm text-red-500">{errors.verificationLink.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="credentialId">ID Credenziale</Label>
                                        <Input
                                            id="credentialId"
                                            placeholder="es. ABC-123-XYZ"
                                            {...register("credentialId")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Descrizione</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Descrivi cosa hai imparato..."
                                            rows={5}
                                            {...register("description")}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Competenze (Skills)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Skill acquisite</Label>
                                        <Input
                                            placeholder="Premi Enter per aggiungere..."
                                            value={skillInput}
                                            onChange={(e) => setSkillInput(e.target.value)}
                                            onKeyDown={handleAddSkill}
                                        />
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {skills.map((skill, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm cursor-pointer hover:bg-primary/20"
                                                    onClick={() => handleRemoveSkill(i)}
                                                >
                                                    {skill} ×
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
                                        <Label htmlFor="issuedAt">Data Conseguimento *</Label>
                                        <Input
                                            id="issuedAt"
                                            type="date"
                                            {...register("issuedAt")}
                                        />
                                        {errors.issuedAt && (
                                            <p className="text-sm text-red-500">{errors.issuedAt.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="expiresAt">Data Scadenza (opzionale)</Label>
                                        <Input
                                            id="expiresAt"
                                            type="date"
                                            {...register("expiresAt")}
                                        />
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
                                        Salva Certificazione
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
