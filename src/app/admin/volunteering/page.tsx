import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { VolunteeringDataTable } from "./volunteering-data-table";
import type { ContentStatus } from "@/lib/validations";

export const dynamic = "force-dynamic";

async function getVolunteering() {
    try {
        const entries = await prisma.volunteering.findMany({
            orderBy: { order: "asc" },
        });

        return entries.map((entry) => ({
            ...entry,
            tags: JSON.parse(entry.tags),
            status: entry.status as ContentStatus,
        }));
    } catch (error) {
        console.error("getVolunteering failed:", error);
        return [];
    }
}

export default async function VolunteeringPage() {
    await auth();
    const entries = await getVolunteering();

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Volontariato</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestisci le tue esperienze di volontariato e impatto sociale.
                    </p>
                </div>
                <VolunteeringDataTable data={entries} />
            </div>
        </DashboardShell>
    );
}
