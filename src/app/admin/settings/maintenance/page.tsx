import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MaintenanceSettingsForm } from "./maintenance-settings-form";

export const dynamic = "force-dynamic";

async function getMaintenance() {
  try {
    return await prisma.siteMaintenance.findUnique({
      where: { id: "global" },
    });
  } catch (error) {
    console.error("getMaintenance failed:", error);
    return null;
  }
}

export default async function MaintenanceSettingsPage() {
  await requirePermission("EDIT_SETTINGS");
  const maintenance = await getMaintenance();

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modalità Manutenzione</h1>
          <p className="text-muted-foreground mt-1">
            Attiva/disattiva la pagina di manutenzione del portfolio.
          </p>
        </div>
        <MaintenanceSettingsForm initialData={maintenance} />
      </div>
    </DashboardShell>
  );
}
