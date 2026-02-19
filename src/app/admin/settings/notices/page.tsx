import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NoticeSettingsForm } from "./notice-settings-form";

export const dynamic = "force-dynamic";

async function getNotice() {
    try {
        return await prisma.globalNotice.findFirst({
            orderBy: { updatedAt: "desc" },
        });
    } catch (error) {
        console.error("getNotice failed:", error);
        return null;
    }
}

export default async function NoticeSettingsPage() {
    await requirePermission("MANAGE_NOTICE");
    const notice = await getNotice();

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Avviso Globale</h1>
                    <p className="text-muted-foreground mt-1">
                        Configura un avviso visibile a tutti i visitatori.
                    </p>
                </div>
                <NoticeSettingsForm initialData={notice} />
            </div>
        </DashboardShell>
    );
}
