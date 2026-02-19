import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { UsersDataTable } from "./users-data-table";
import { UserRole, UserStatus } from "@/lib/validations";

export const dynamic = "force-dynamic";

async function getUsers() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            role: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
        },
    });

    return users.map(user => ({
        ...user,
        role: user.role as UserRole,
        status: user.status as UserStatus,
    }));
}

export default async function UsersPage() {
    await requirePermission("VIEW_USERS");
    const users = await getUsers();

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Utenti</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestisci gli utenti e i loro permessi.
                    </p>
                </div>
                <UsersDataTable data={users} />
            </div>
        </DashboardShell>
    );
}
