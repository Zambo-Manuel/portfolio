import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CertificationsDataTable } from "./certifications-data-table";
import type { ContentStatus } from "@/lib/validations";

export const dynamic = "force-dynamic";

async function getCertifications() {
    try {
        const certifications = await prisma.certification.findMany({
            orderBy: { updatedAt: "desc" },
            include: {
                createdBy: { select: { displayName: true } },
            },
        });

        return certifications.map((cert) => ({
            ...cert,
            skills: JSON.parse(cert.skills),
            status: cert.status as ContentStatus,
        }));
    } catch (error) {
        console.error("getCertifications failed:", error);
        return [];
    }
}

export default async function CertificationsPage() {
    await auth();
    const certifications = await getCertifications();

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Certificazioni</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestisci le tue certificazioni e attestati.
                    </p>
                </div>
                <CertificationsDataTable data={certifications} />
            </div>
        </DashboardShell>
    );
}
