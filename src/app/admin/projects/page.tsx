import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProjectsDataTable } from "./projects-data-table";
import type { ContentStatus } from "@/lib/validations";

export const dynamic = "force-dynamic";

async function getProjects() {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { updatedAt: "desc" },
            include: {
                createdBy: { select: { displayName: true } },
            },
        });

        return projects.map((project) => ({
            ...project,
            tags: JSON.parse(project.tags),
            techStack: JSON.parse(project.techStack),
            images: JSON.parse(project.images),
            status: project.status as ContentStatus,
        }));
    } catch (error) {
        console.error("getProjects failed:", error);
        return [];
    }
}

export default async function ProjectsPage() {
    await auth();
    const projects = await getProjects();

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Progetti</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestisci i progetti del tuo portfolio.
                    </p>
                </div>
                <ProjectsDataTable data={projects} />
            </div>
        </DashboardShell>
    );
}
