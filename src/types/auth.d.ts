import { UserRole, UserStatus } from "@/lib/validations";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            username: string;
            email: string;
            displayName: string;
            role: UserRole;
            mustResetPassword: boolean;
        };
    }

    interface User {
        id: string;
        username: string;
        email: string;
        displayName: string;
        role: UserRole;
        status: UserStatus;
        mustResetPassword: boolean;
        failedLoginAttempts: number;
        lockedUntil: Date | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        username: string;
        email: string;
        displayName: string;
        role: UserRole;
        status: UserStatus;
        mustResetPassword: boolean;
        failedLoginAttempts: number;
        lockedUntil: Date | null;
    }
}
