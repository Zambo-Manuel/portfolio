// Role-Based Access Control (RBAC) utilities
// Defines permissions for each role and helper functions

import { UserRole } from "@/lib/validations";


// Permission definitions
export const PERMISSIONS = {
    // User management
    VIEW_USERS: [UserRole.SUPER_ADMIN],
    CREATE_USER: [UserRole.SUPER_ADMIN],
    EDIT_USER: [UserRole.SUPER_ADMIN],
    DELETE_USER: [UserRole.SUPER_ADMIN],

    // Content management
    VIEW_CONTENT: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR],
    CREATE_CONTENT: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR],
    EDIT_CONTENT: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR],
    DELETE_CONTENT: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    PUBLISH_CONTENT: [UserRole.SUPER_ADMIN, UserRole.ADMIN],

    // Settings
    VIEW_SETTINGS: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    EDIT_SETTINGS: [UserRole.SUPER_ADMIN],

    // Global notice
    MANAGE_NOTICE: [UserRole.SUPER_ADMIN, UserRole.ADMIN],

    // Audit logs
    VIEW_AUDIT_LOGS: [UserRole.SUPER_ADMIN],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
    return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}

// Check multiple permissions (returns true if user has at least one)
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some((permission) => hasPermission(role, permission));
}

// Check multiple permissions (returns true if user has all)
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every((permission) => hasPermission(role, permission));
}



// Role hierarchy for display
export const ROLE_LABELS: Record<UserRole, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Amministratore",
    EDITOR: "Editor",
};

export const ROLE_COLORS: Record<UserRole, string> = {
    SUPER_ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    EDITOR: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};
