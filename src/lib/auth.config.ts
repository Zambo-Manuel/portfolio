import type { NextAuthConfig } from "next-auth";
import { UserRole, UserStatus } from "@/lib/validations";

export const authConfig = {
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.email = user.email;
                token.displayName = user.displayName;
                token.role = user.role as UserRole;
                token.status = user.status as UserStatus;
                token.mustResetPassword = user.mustResetPassword;
                token.failedLoginAttempts = user.failedLoginAttempts;
                token.lockedUntil = user.lockedUntil;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.username = token.username;
                session.user.email = token.email;
                session.user.displayName = token.displayName;
                session.user.role = token.role as UserRole;
                session.user.mustResetPassword = token.mustResetPassword;
            }
            return session;
        },
    },
    providers: [], // Providers configured in auth.ts
} satisfies NextAuthConfig;
