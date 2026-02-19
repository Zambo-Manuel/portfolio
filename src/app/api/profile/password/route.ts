import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

export async function PUT(req: Request) {
    try {
        const session = await auth();

        if (!session?.user) {
            return new NextResponse("Non autorizzato", { status: 401 });
        }

        const body = await req.json();
        const validation = changePasswordSchema.safeParse(body);

        if (!validation.success) {
            return new NextResponse(validation.error.issues?.[0]?.message ?? "Dati non validi", { status: 400 });
        }

        const { currentPassword, newPassword } = validation.data;

        // Verify current password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return new NextResponse("Utente non trovato", { status: 404 });
        }

        const isValid = await verifyPassword(currentPassword, user.passwordHash);

        console.log("Password change request for:", user.username);
        console.log("Current password valid:", isValid);

        if (!isValid) {
            return new NextResponse("Password attuale non corretta", { status: 400 });
        }

        // Update password
        const passwordHash = await hashPassword(newPassword);
        console.log("New password hash generated");

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                mustResetPassword: false, // Reset the flag
                lockedUntil: null,
                failedLoginAttempts: 0,
            },
        });

        console.log("User updated. MustResetPassword:", updatedUser.mustResetPassword);

        await logAudit("PASSWORD_CHANGE", "USER", user.id, {
            metadata: { method: "self-service" }
        });

        return NextResponse.json({ message: "Password aggiornata con successo" });
    } catch (error) {
        console.error("Change password error:", error);
        return new NextResponse("Errore interno", { status: 500 });
    }
}
