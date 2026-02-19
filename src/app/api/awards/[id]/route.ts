import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit, logAuditWithDiff } from "@/lib/audit";
import { awardUpdateSchema } from "@/lib/validations";

// GET /api/awards/[id]
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

        const award = await prisma.award.findUnique({
            where: { id },
            include: {
                createdBy: { select: { displayName: true } },
                updatedBy: { select: { displayName: true } },
            },
        });

        if (!award) {
            return NextResponse.json({ message: "Riconoscimento non trovato" }, { status: 404 });
        }

        return NextResponse.json({
            ...award,
            tags: JSON.parse(award.tags),
        });
    } catch (error) {
        console.error("Error fetching award:", error);
        return NextResponse.json(
            { message: "Errore durante il recupero del riconoscimento" },
            { status: 500 }
        );
    }
}

// PATCH /api/awards/[id]
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
        const data = awardUpdateSchema.parse(body);

        // Get current award for audit
        const currentAward = await prisma.award.findUnique({
            where: { id },
        });

        if (!currentAward) {
            return NextResponse.json({ message: "Riconoscimento non trovato" }, { status: 404 });
        }

        // Check publish permission
        if (data.status === "PUBLISHED" && !hasPermission(session.user.role, "PUBLISH_CONTENT")) {
            return NextResponse.json(
                { message: "Non hai i permessi per pubblicare" },
                { status: 403 }
            );
        }

        // Update award
        const updatedAward = await prisma.award.update({
            where: { id },
            data: {
                ...data,
                tags: data.tags ? JSON.stringify(data.tags) : undefined,
                awardedAt: data.awardedAt ? new Date(data.awardedAt) : undefined,
                updatedById: session.user.id,
            },
        });

        // Log changes
        await logAuditWithDiff("UPDATE", "AWARD", id, currentAward as any, updatedAward as any);

        return NextResponse.json({
            ...updatedAward,
            tags: JSON.parse(updatedAward.tags),
        });
    } catch (error: any) {
        console.error("Error updating award:", error);

        if (error?.name === "ZodError") {
            return NextResponse.json(
                { message: "Dati non validi", errors: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Errore durante l'aggiornamento del riconoscimento", detail: String(error) },
            { status: 500 }
        );
    }
}

// DELETE /api/awards/[id]
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

        const award = await prisma.award.findUnique({ where: { id } });
        if (!award) {
            return NextResponse.json({ message: "Riconoscimento non trovato" }, { status: 404 });
        }

        await prisma.award.delete({ where: { id } });

        // Log action
        await logAudit("DELETE", "AWARD", id, {
            before: { title: award.title, issuer: award.issuer },
        });

        return NextResponse.json({ message: "Riconoscimento eliminato" });
    } catch (error) {
        console.error("Error deleting award:", error);
        return NextResponse.json(
            { message: "Errore durante l'eliminazione del riconoscimento", detail: String(error) },
            { status: 500 }
        );
    }
}
