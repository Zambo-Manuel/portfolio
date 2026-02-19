// Rate limiting utility using rate-limiter-flexible
// Provides IP-based and account-based rate limiting for login attempts

import { RateLimiterMemory } from "rate-limiter-flexible";
import { headers } from "next/headers";

// Rate limiter for login attempts by IP
const rateLimiterByIP = new RateLimiterMemory({
    points: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || "5"),
    duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000") / 1000, // Convert ms to seconds
});

// Rate limiter for login attempts by username
const rateLimiterByUsername = new RateLimiterMemory({
    points: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || "5") * 2, // Allow more attempts per username
    duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000") / 1000,
});

export interface RateLimitResult {
    success: boolean;
    remainingPoints?: number;
    msBeforeNext?: number;
    error?: string;
}

export async function checkRateLimit(username?: string): Promise<RateLimitResult> {
    try {
        const headersList = await headers();
        const forwardedFor = headersList.get("x-forwarded-for");
        const realIP = headersList.get("x-real-ip");
        const ip = forwardedFor?.split(",")[0] || realIP || "unknown";

        // Check IP rate limit
        try {
            const ipResult = await rateLimiterByIP.consume(ip);

            // If username provided, also check username rate limit
            if (username) {
                try {
                    await rateLimiterByUsername.consume(username);
                } catch (usernameRateLimitError: any) {
                    return {
                        success: false,
                        remainingPoints: 0,
                        msBeforeNext: usernameRateLimitError.msBeforeNext,
                        error: `Troppi tentativi per questo username. Riprova tra ${Math.ceil(usernameRateLimitError.msBeforeNext / 1000 / 60)} minuti.`,
                    };
                }
            }

            return {
                success: true,
                remainingPoints: ipResult.remainingPoints,
            };
        } catch (ipRateLimitError: any) {
            return {
                success: false,
                remainingPoints: 0,
                msBeforeNext: ipRateLimitError.msBeforeNext,
                error: `Troppi tentativi. Riprova tra ${Math.ceil(ipRateLimitError.msBeforeNext / 1000 / 60)} minuti.`,
            };
        }
    } catch (error) {
        console.error("Rate limit check error:", error);
        // Allow request if rate limiter fails
        return { success: true };
    }
}

export async function resetRateLimit(username: string): Promise<void> {
    try {
        const headersList = await headers();
        const forwardedFor = headersList.get("x-forwarded-for");
        const realIP = headersList.get("x-real-ip");
        const ip = forwardedFor?.split(",")[0] || realIP || "unknown";

        await rateLimiterByIP.delete(ip);
        await rateLimiterByUsername.delete(username);
    } catch (error) {
        console.error("Rate limit reset error:", error);
    }
}
