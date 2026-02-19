import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAuditWithDiff } from "@/lib/audit";
import { updateUserSchema } from "@/lib/validations";

// GET /api/users/[id] - Get single user
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

        if (!hasPermission(session.user.role, "VIEW_USERS")) {
            return NextResponse.json({ message: "Permesso negato" }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                role: true,
                status: true,
                mustResetPassword: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ message: "Utente non trovato" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { message: "Errore durante il recupero dell'utente" },
            { status: 500 }
        );
    }
}

// PATCH /api/users/[id] - Update user
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

        if (!hasPermission(session.user.role, "EDIT_USER")) {
            return NextResponse.json({ message: "Permesso negato" }, { status: 403 });
        }

        const body = await request.json();
        const data = updateUserSchema.parse(body);

        // Get current user data for audit
        const currentUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!currentUser) {
            return NextResponse.json({ message: "Utente non trovato" }, { status: 404 });
        }

        // Check for email uniqueness if changing
        if (data.email && data.email !== currentUser.email) {
            const existing = await prisma.user.findUnique({
                where: { email: data.email },
            });
            if (existing) {
                return NextResponse.json({ message: "Email già in uso" }, { status: 400 });
            }
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                email: data.email,
                displayName: data.displayName,
                role: data.role,
                status: data.status,
            },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                role: true,
                status: true,
            },
        });

        // Log changes
        await logAuditWithDiff(
            "UPDATE",
            "USER",
            id,
            { email: currentUser.email, displayName: currentUser.displayName, role: currentUser.role, status: currentUser.status },
            { email: updatedUser.email, displayName: updatedUser.displayName, role: updatedUser.role, status: updatedUser.status }
        );

        return NextResponse.json(updatedUser);
    } catch (error: any) {
        console.error("Error updating user:", error);

        if (error?.name === "ZodError") {
            return NextResponse.json(
                { message: "Dati non validi", errors: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Errore durante l'aggiornamento dell'utente" },
            { status: 500 }
        );
    }
}

// DELETE /api/users/[id] - Delete user
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

        if (!hasPermission(session.user.role, "DELETE_USER")) {
            return NextResponse.json({ message: "Permesso negato" }, { status: 403 });
        }

        // Prevent self-deletion
        if (session.user.id === id) {
            return NextResponse.json(
                { message: "Non puoi eliminare il tuo stesso account" },
                { status: 400 }
            );
        }

        await prisma.user.delete({ where: { id } });

        return NextResponse.json({ message: "Utente eliminato" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { message: "Errore durante l'eliminazione dell'utente" },
            { status: 500 }
        );
    }
}
