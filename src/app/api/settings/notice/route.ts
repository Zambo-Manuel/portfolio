import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { globalNoticeSchema } from "@/lib/validations";
import { publicCorsHeaders, publicOptionsResponse } from "@/lib/publicCors";

export function OPTIONS(request: NextRequest) {
    return publicOptionsResponse(request);
}

// GET /api/settings/notice - Get global notice (Public)
export async function GET(request: NextRequest) {
    try {
        const notice = await prisma.globalNotice.findFirst({
            where: { active: true },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json(notice || { active: false }, {
            headers: publicCorsHeaders(request),
        });
    } catch (error) {
        console.error("Error fetching notice:", error);
        return NextResponse.json(
            { message: "Errore durante il recupero dell'avviso" },
            { status: 500, headers: publicCorsHeaders(request) }
        );
    }
}

// PUT /api/settings/notice - Update or create global notice
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ message: "Non autorizzato" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, "MANAGE_NOTICE")) {
            return NextResponse.json({ message: "Permesso negato" }, { status: 403 });
        }

        const body = await request.json();
        const data = globalNoticeSchema.parse(body);

        // Find existing notice or create new one
        const existingNotice = await prisma.globalNotice.findFirst();

        let notice;
        if (existingNotice) {
            notice = await prisma.globalNotice.update({
                where: { id: existingNotice.id },
                data: {
                    ...data,
                    startAt: data.startAt ? new Date(data.startAt) : null,
                    endAt: data.endAt ? new Date(data.endAt) : null,
                    updatedById: session.user.id,
                },
            });
        } else {
            notice = await prisma.globalNotice.create({
                data: {
                    ...data,
                    startAt: data.startAt ? new Date(data.startAt) : null,
                    endAt: data.endAt ? new Date(data.endAt) : null,
                    updatedById: session.user.id,
                },
            });
        }

        await logAudit(existingNotice ? "UPDATE" : "CREATE", "GLOBAL_NOTICE", notice.id, {
            after: { title: notice.title, active: notice.active, type: notice.type },
        });

        return NextResponse.json(notice);
    } catch (error: any) {
        console.error("Error updating notice:", error);

        if (error?.name === "ZodError") {
            return NextResponse.json(
                { message: "Dati non validi", errors: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Errore durante l'aggiornamento dell'avviso" },
            { status: 500 }
        );
    }
}
