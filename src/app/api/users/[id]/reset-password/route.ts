import { NextRequest, NextResponse } from "next/server";
import { auth, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { resetPasswordSchema } from "@/lib/validations";

// POST /api/users/[id]/reset-password - Reset user password
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user) {
            return NextResponse.json({ message: "Non autorizzato" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, "EDIT_USER")) {
            return NextResponse.json({ message: "Permesso negato" }, { status: 403 });
        }

        const body = await request.json();
        const data = resetPasswordSchema.parse(body);

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return NextResponse.json({ message: "Utente non trovato" }, { status: 404 });
        }

        // Hash new password
        const passwordHash = await hashPassword(data.newPassword);

        // Update password
        await prisma.user.update({
            where: { id },
            data: {
                passwordHash,
                mustResetPassword: true,
                failedLoginAttempts: 0,
                lockedUntil: null,
            },
        });

        // Log action
        await logAudit("PASSWORD_CHANGE", "USER", id, {
            metadata: { resetBy: session.user.username },
        });

        return NextResponse.json({ message: "Password reimpostata con successo" });
    } catch (error: any) {
        console.error("Error resetting password:", error);

        if (error?.name === "ZodError") {
            return NextResponse.json(
                { message: "Password non valida", errors: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Errore durante il reset della password" },
            { status: 500 }
        );
    }
}
