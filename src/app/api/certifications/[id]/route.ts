import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit, logAuditWithDiff } from "@/lib/audit";
import { certificationUpdateSchema } from "@/lib/validations";

// GET /api/certifications/[id]
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

        const certification = await prisma.certification.findUnique({
            where: { id },
            include: {
                createdBy: { select: { displayName: true } },
                updatedBy: { select: { displayName: true } },
            },
        });

        if (!certification) {
            return NextResponse.json({ message: "Certificazione non trovata" }, { status: 404 });
        }

        return NextResponse.json({
            ...certification,
            skills: JSON.parse(certification.skills),
        });
    } catch (error) {
        console.error("Error fetching certification:", error);
        return NextResponse.json(
            { message: "Errore durante il recupero della certificazione" },
            { status: 500 }
        );
    }
}

// PATCH /api/certifications/[id]
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
        const data = certificationUpdateSchema.parse(body);

        // Get current certification for audit
        const currentCertification = await prisma.certification.findUnique({
            where: { id },
        });

        if (!currentCertification) {
            return NextResponse.json({ message: "Certificazione non trovata" }, { status: 404 });
        }

        // Check publish permission
        if (data.status === "PUBLISHED" && !hasPermission(session.user.role, "PUBLISH_CONTENT")) {
            return NextResponse.json(
                { message: "Non hai i permessi per pubblicare" },
                { status: 403 }
            );
        }

        // Update certification
        const updatedCertification = await prisma.certification.update({
            where: { id },
            data: {
                ...data,
                skills: data.skills ? JSON.stringify(data.skills) : undefined,
                issuedAt: data.issuedAt ? new Date(data.issuedAt) : undefined,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : (data.expiresAt === null ? null : undefined),
                updatedById: session.user.id,
            },
        });

        // Log changes
        await logAuditWithDiff("UPDATE", "CERTIFICATION", id, currentCertification as any, updatedCertification as any);

        return NextResponse.json({
            ...updatedCertification,
            skills: JSON.parse(updatedCertification.skills),
        });
    } catch (error: any) {
        console.error("Error updating certification:", error);

        if (error?.name === "ZodError") {
            return NextResponse.json(
                { message: "Dati non validi", errors: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Errore durante l'aggiornamento della certificazione", detail: String(error) },
            { status: 500 }
        );
    }
}

// DELETE /api/certifications/[id]
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

        const certification = await prisma.certification.findUnique({ where: { id } });
        if (!certification) {
            return NextResponse.json({ message: "Certificazione non trovata" }, { status: 404 });
        }

        await prisma.certification.delete({ where: { id } });

        // Log action
        await logAudit("DELETE", "CERTIFICATION", id, {
            before: { title: certification.title, issuer: certification.issuer },
        });

        return NextResponse.json({ message: "Certificazione eliminata" });
    } catch (error) {
        console.error("Error deleting certification:", error);
        return NextResponse.json(
            { message: "Errore durante l'eliminazione della certificazione", detail: String(error) },
            { status: 500 }
        );
    }
}
