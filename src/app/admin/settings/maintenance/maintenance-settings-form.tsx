"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { maintenanceSchema, type MaintenanceInput } from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Save, Wrench } from "lucide-react";

interface MaintenanceSettingsFormProps {
  initialData: any | null;
}

export function MaintenanceSettingsForm({ initialData }: MaintenanceSettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MaintenanceInput>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      enabled: initialData?.enabled ?? false,
      title: initialData?.title || "Manutenzione in corso",
      message: initialData?.message || "Stiamo effettuando alcuni aggiornamenti. Torna tra poco.",
    },
  });

  const onSubmit = async (data: MaintenanceInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Errore durante il salvataggio");
      }

      toast.success("Impostazioni manutenzione salvate");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Errore durante il salvataggio");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Alert>
        <Wrench className="h-4 w-4" />
        <AlertTitle>Come funziona</AlertTitle>
        <AlertDescription>
          Quando la manutenzione è <strong>attiva</strong>, il portfolio reindirizza alla pagina di manutenzione.
          <strong> CV, Privacy/Cookie Policy e la Dashboard restano accessibili</strong>.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contenuto pagina</CardTitle>
              <CardDescription>
                Questi testi verranno mostrati nella pagina di manutenzione del portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titolo *</Label>
                <Input id="title" placeholder="Manutenzione in corso" {...register("title")} />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Messaggio *</Label>
                <Textarea id="message" rows={5} placeholder="Scrivi un messaggio..." {...register("message")} />
                {errors.message && (
                  <p className="text-sm text-red-500">{errors.message.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anteprima rapida</CardTitle>
              <CardDescription>
                Come apparirà il box nella pagina maintenance.html
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4">
                <p className="font-semibold">{watch("title") || "Manutenzione in corso"}</p>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {watch("message") || "Stiamo effettuando alcuni aggiornamenti. Torna tra poco."}
                </p>
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
                  <Label htmlFor="enabled">Manutenzione attiva</Label>
                  <p className="text-sm text-muted-foreground">Mostra la pagina di manutenzione sul portfolio</p>
                </div>
                <Switch
                  id="enabled"
                  checked={!!watch("enabled")}
                  onCheckedChange={(checked) => setValue("enabled", checked)}
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
                Salva
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
