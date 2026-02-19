
// NextAuth configuration with Credentials provider
// Implements JWT sessions with Argon2 password hashing

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import * as argon2 from "argon2";
import { UserRole, UserStatus } from "@/lib/validations";
import { authConfig } from "@/lib/auth.config";

// Argon2 configuration for password hashing
export const hashPassword = async (password: string): Promise<string> => {
    return argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
    });
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    try {
        return await argon2.verify(hash, password);
    } catch {
        return false;
    }
};

// Account lockout constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    throw new Error("Credenziali mancanti");
                }

                const username = credentials.username as string;
                const password = credentials.password as string;

                // Find user by username
                const user = await prisma.user.findUnique({
                    where: { username },
                });

                if (!user) {
                    console.log("Login attempt: User not found for", username);
                    throw new Error("Credenziali non valide");
                }

                console.log(`Login attempt for ${username}: Role=${user.role}, Status=${user.status}, MustReset=${user.mustResetPassword}`);

                // Check if account is locked
                if (user.lockedUntil && user.lockedUntil > new Date()) {
                    const minutesLeft = Math.ceil(
                        (user.lockedUntil.getTime() - Date.now()) / 1000 / 60
                    );
                    throw new Error(
                        `Account bloccato.Riprova tra ${minutesLeft} minuti.`
                    );
                }

                // Check if user is active
                if (user.status !== UserStatus.ACTIVE) {
                    throw new Error("Account disattivato. Contatta l'amministratore.");
                }

                // Verify password
                const isValidPassword = await verifyPassword(password, user.passwordHash);

                if (!isValidPassword) {
                    // Increment failed attempts
                    const newAttempts = user.failedLoginAttempts + 1;
                    const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            failedLoginAttempts: newAttempts,
                            lockedUntil: shouldLock
                                ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
                                : null,
                        },
                    });

                    if (shouldLock) {
                        throw new Error(
                            `Troppi tentativi falliti.Account bloccato per ${LOCKOUT_DURATION_MINUTES} minuti.`
                        );
                    }

                    const attemptsLeft = MAX_FAILED_ATTEMPTS - newAttempts;
                    throw new Error(
                        `Credenziali non valide.${attemptsLeft} tentativi rimasti.`
                    );
                }

                // Reset failed attempts and update last login
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        failedLoginAttempts: 0,
                        lockedUntil: null,
                        lastLoginAt: new Date(),
                    },
                });

                return {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                    role: user.role as UserRole,
                    status: user.status as UserStatus,
                    mustResetPassword: user.mustResetPassword,
                    failedLoginAttempts: 0,
                    lockedUntil: null,
                };
            },
        }),
    ],
});

