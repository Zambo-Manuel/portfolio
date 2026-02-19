import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AwardsDataTable } from "./awards-data-table";
import type { ContentStatus } from "@/lib/validations";

export const dynamic = "force-dynamic";

async function getAwards() {
    try {
        const awards = await prisma.award.findMany({
            orderBy: { updatedAt: "desc" },
        });

        return awards.map((award) => ({
            ...award,
            tags: JSON.parse(award.tags),
            status: award.status as ContentStatus,
        }));
    } catch (error) {
        console.error("getAwards failed:", error);
        return [];
    }
}

export default async function AwardsPage() {
    await auth();
    const awards = await getAwards();

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Riconoscimenti</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestisci premi, onorificenze e riconoscimenti.
                    </p>
                </div>
                <AwardsDataTable data={awards} />
            </div>
        </DashboardShell>
    );
}
