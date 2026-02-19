import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit, logAuditWithDiff } from "@/lib/audit";
import { languageUpdateSchema } from "@/lib/validations";

// GET /api/languages/[id]
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

        const language = await prisma.language.findUnique({
            where: { id },
            include: {
                createdBy: { select: { displayName: true } },
                updatedBy: { select: { displayName: true } },
            },
        });

        if (!language) {
            return NextResponse.json({ message: "Lingua non trovata" }, { status: 404 });
        }

        return NextResponse.json(language);
    } catch (error) {
        console.error("Error fetching language:", error);
        return NextResponse.json(
            { message: "Errore durante il recupero della lingua" },
            { status: 500 }
        );
    }
}

// PATCH /api/languages/[id]
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
        const data = languageUpdateSchema.parse(body);

        // Get current language for audit
        const currentLanguage = await prisma.language.findUnique({
            where: { id },
        });

        if (!currentLanguage) {
            return NextResponse.json({ message: "Lingua non trovata" }, { status: 404 });
        }

        // Update language
        const updatedLanguage = await prisma.language.update({
            where: { id },
            data: {
                ...data,
                updatedById: session.user.id,
            },
        });

        // Log changes
        await logAuditWithDiff("UPDATE", "LANGUAGE", id, currentLanguage as any, updatedLanguage as any);

        return NextResponse.json(updatedLanguage);
    } catch (error: any) {
        console.error("Error updating language:", error);

            if (error?.name === "ZodError") {
            return NextResponse.json(
                { message: "Dati non validi", errors: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Errore durante l'aggiornamento della lingua" },
            { status: 500 }
        );
    }
}

// DELETE /api/languages/[id]
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

        const language = await prisma.language.findUnique({ where: { id } });
        if (!language) {
            return NextResponse.json({ message: "Lingua non trovata" }, { status: 404 });
        }

        await prisma.language.delete({ where: { id } });

        // Log action
        await logAudit("DELETE", "LANGUAGE", id, {
            before: { name: language.name },
        });

        return NextResponse.json({ message: "Lingua eliminata" });
    } catch (error) {
        console.error("Error deleting language:", error);
        return NextResponse.json(
            { message: "Errore durante l'eliminazione della lingua" },
            { status: 500 }
        );
    }
}
