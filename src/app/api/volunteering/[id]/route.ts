import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit, logAuditWithDiff } from "@/lib/audit";
import { volunteeringUpdateSchema } from "@/lib/validations";

// GET /api/volunteering/[id]
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

        const entry = await prisma.volunteering.findUnique({
            where: { id },
            include: {
                createdBy: { select: { displayName: true } },
                updatedBy: { select: { displayName: true } },
            },
        });

        if (!entry) {
            return NextResponse.json({ message: "Voce non trovata" }, { status: 404 });
        }

        return NextResponse.json({
            ...entry,
            tags: JSON.parse(entry.tags),
        });
    } catch (error) {
        console.error("Error fetching volunteering:", error);
        return NextResponse.json(
            { message: "Errore durante il recupero della voce" },
            { status: 500 }
        );
    }
}

// PATCH /api/volunteering/[id]
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
        const data = volunteeringUpdateSchema.parse(body);

        // Get current entry for audit
        const currentEntry = await prisma.volunteering.findUnique({
            where: { id },
        });

        if (!currentEntry) {
            return NextResponse.json({ message: "Voce non trovata" }, { status: 404 });
        }

        // Check publish permission
        if (data.status === "PUBLISHED" && !hasPermission(session.user.role, "PUBLISH_CONTENT")) {
            return NextResponse.json(
                { message: "Non hai i permessi per pubblicare" },
                { status: 403 }
            );
        }

        // Update entry
        const updatedEntry = await prisma.volunteering.update({
            where: { id },
            data: {
                ...data,
                tags: data.tags ? JSON.stringify(data.tags) : undefined,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : (data.endDate === null ? null : undefined),
                updatedById: session.user.id,
            },
        });

        // Log changes
        await logAuditWithDiff("UPDATE", "VOLUNTEERING", id, currentEntry as any, updatedEntry as any);

        return NextResponse.json({
            ...updatedEntry,
            tags: JSON.parse(updatedEntry.tags),
        });
    } catch (error: any) {
        console.error("Error updating volunteering:", error);

        if (error?.name === "ZodError") {
            return NextResponse.json(
                { message: "Dati non validi", errors: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Errore durante l'aggiornamento della voce", detail: String(error) },
            { status: 500 }
        );
    }
}

// DELETE /api/volunteering/[id]
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

        const entry = await prisma.volunteering.findUnique({ where: { id } });
        if (!entry) {
            return NextResponse.json({ message: "Voce non trovata" }, { status: 404 });
        }

        await prisma.volunteering.delete({ where: { id } });

        // Log action
        await logAudit("DELETE", "VOLUNTEERING", id, {
            before: { organization: entry.organization, role: entry.role },
        });

        return NextResponse.json({ message: "Voce eliminata" });
    } catch (error) {
        console.error("Error deleting volunteering:", error);
        return NextResponse.json(
            { message: "Errore durante l'eliminazione della voce", detail: String(error) },
            { status: 500 }
        );
    }
}
