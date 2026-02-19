import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LanguagesDataTable } from "./languages-data-table";

export const dynamic = "force-dynamic";

async function getLanguages() {
    try {
        const languages = await prisma.language.findMany({
            orderBy: { order: "asc" },
            include: {
                certification: { select: { title: true } }
            }
        });

        return languages;
    } catch (error) {
        console.error("getLanguages failed:", error);
        return [];
    }
}

export default async function LanguagesPage() {
    await auth();
    const languages = await getLanguages();

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lingue</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestisci le lingue che conosci e il tuo livello di competenza.
                    </p>
                </div>
                <LanguagesDataTable data={languages as any} />
            </div>
        </DashboardShell>
    );
}
