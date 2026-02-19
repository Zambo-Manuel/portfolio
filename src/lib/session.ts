import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/lib/validations";
import { hasPermission, Permission } from "@/lib/permissions";

// Server-side permission check with redirect
export async function requirePermission(permission: Permission): Promise<void> {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if (!hasPermission(session.user.role, permission)) {
        redirect("/unauthorized");
    }
}

// Server-side authentication check
export async function requireAuth() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return session;
}

// Get current user's role
export async function getCurrentUserRole(): Promise<UserRole | null> {
    const session = await auth();
    return session?.user?.role ?? null;
}
