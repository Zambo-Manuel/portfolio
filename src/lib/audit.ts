// Audit logging utility
// Records all significant actions for accountability

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export type AuditAction =
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "LOGIN"
    | "LOGOUT"
    | "PASSWORD_CHANGE"
    | "STATUS_CHANGE"
    | "PUBLISH"
    | "ARCHIVE";

export type EntityType =
    | "USER"
    | "PROJECT"
    | "CERTIFICATION"
    | "VOLUNTEERING"
    | "AWARD"
    | "LANGUAGE"
    | "GLOBAL_NOTICE"
    | "SETTINGS";

interface AuditPayload {
    before?: Record<string, any>;
    after?: Record<string, any>;
    changes?: Record<string, { from: any; to: any }>;
    metadata?: Record<string, any>;
}

export async function logAudit(
    action: AuditAction,
    entityType: EntityType,
    entityId?: string,
    payload?: AuditPayload
): Promise<void> {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            console.warn("Audit log attempted without authenticated user");
            return;
        }

        await prisma.auditLog.create({
            data: {
                actorUserId: session.user.id,
                action,
                entityType,
                entityId,
                payload: payload ? JSON.stringify(payload) : null,
            },
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
        // Don't throw - audit logging should not break the main operation
    }
}

// Helper to calculate diff between objects
export function calculateDiff(
    before: Record<string, any>,
    after: Record<string, any>
): Record<string, { from: any; to: any }> {
    const changes: Record<string, { from: any; to: any }> = {};

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
        // Skip internal fields
        if (key === "updatedAt" || key === "passwordHash") continue;

        const beforeValue = before[key];
        const afterValue = after[key];

        // Compare values (handle dates and arrays)
        const beforeStr = JSON.stringify(beforeValue);
        const afterStr = JSON.stringify(afterValue);

        if (beforeStr !== afterStr) {
            changes[key] = { from: beforeValue, to: afterValue };
        }
    }

    return changes;
}

// Log with automatic diff calculation
export async function logAuditWithDiff(
    action: AuditAction,
    entityType: EntityType,
    entityId: string,
    before: Record<string, any>,
    after: Record<string, any>
): Promise<void> {
    const changes = calculateDiff(before, after);

    if (Object.keys(changes).length > 0) {
        await logAudit(action, entityType, entityId, { changes });
    }
}
