import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit, logAuditWithDiff } from "@/lib/audit";
import { projectUpdateSchema } from "@/lib/validations";

// GET /api/projects/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user) {
            return NextResponse.json({ message: "Non autorizzato" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, "VIEW_CONTENT")) {
            return NextResponse.json({ message: "Permesso negato" }, { status: 403 });
        }

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                createdBy: { select: { displayName: true } },
                updatedBy: { select: { displayName: true } },
            },
        });

        if (!project) {
            return NextResponse.json({ message: "Progetto non trovato" }, { status: 404 });
        }

        return NextResponse.json({
            ...project,
            tags: JSON.parse(project.tags),
            techStack: JSON.parse(project.techStack),
            images: JSON.parse(project.images),
        });
    } catch (error) {
        console.error("Error fetching project:", error);
        return NextResponse.json(
            { message: "Errore durante il recupero del progetto" },
            { status: 500 }
        );
    }
}

// PATCH /api/projects/[id]
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user) {
            return NextResponse.json({ message: "Non autorizzato" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, "EDIT_CONTENT")) {
            return NextResponse.json({ message: "Permesso negato" }, { status: 403 });
        }

        const body = await request.json();
        const data = projectUpdateSchema.parse(body);

        // Get current project for audit
        const currentProject = await prisma.project.findUnique({
            where: { id },
        });

        if (!currentProject) {
            return NextResponse.json({ message: "Progetto non trovato" }, { status: 404 });
        }

        // Check slug uniqueness if changing
        if (data.slug && data.slug !== currentProject.slug) {
            const existing = await prisma.project.findUnique({
                where: { slug: data.slug },
            });
            if (existing) {
                return NextResponse.json({ message: "Slug già in uso" }, { status: 400 });
            }
        }

        // Check publish permission
        if (data.status === "PUBLISHED" && !hasPermission(session.user.role, "PUBLISH_CONTENT")) {
            return NextResponse.json(
                { message: "Non hai i permessi per pubblicare" },
                { status: 403 }
            );
        }

        // Update project
        const updatedProject = await prisma.project.update({
            where: { id },
            data: {
                ...data,
                tags: data.tags ? JSON.stringify(data.tags) : undefined,
                techStack: data.techStack ? JSON.stringify(data.techStack) : undefined,
                images: data.images ? JSON.stringify(data.images) : undefined,

                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                repoLink: data.repoLink !== undefined ? (data.repoLink || null) : undefined,
                updatedById: session.user.id,
            },
        });

        // Log changes
        await logAuditWithDiff("UPDATE", "PROJECT", id, currentProject as any, updatedProject as any);

        return NextResponse.json({
            ...updatedProject,
            tags: JSON.parse(updatedProject.tags),
            techStack: JSON.parse(updatedProject.techStack),
            images: JSON.parse(updatedProject.images),
        });
    } catch (error: any) {
        console.error("Error updating project:", error);

        if (error?.name === "ZodError") {
            return NextResponse.json(
                { message: "Dati non validi", errors: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Errore durante l'aggiornamento del progetto", detail: String(error) },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user) {
            return NextResponse.json({ message: "Non autorizzato" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, "DELETE_CONTENT")) {
            return NextResponse.json({ message: "Permesso negato" }, { status: 403 });
        }

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) {
            return NextResponse.json({ message: "Progetto non trovato" }, { status: 404 });
        }

        await prisma.project.delete({ where: { id } });

        // Log action
        await logAudit("DELETE", "PROJECT", id, {
            before: { title: project.title, slug: project.slug },
        });

        return NextResponse.json({ message: "Progetto eliminato" });
    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json(
            { message: "Errore durante l'eliminazione del progetto", detail: String(error) },
            { status: 500 }
        );
    }
}
