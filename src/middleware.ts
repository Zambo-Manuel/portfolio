// Next.js middleware for route protection
// Protects only admin routes and handles authentication redirects

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const pathname = nextUrl.pathname;

    // Routes that require authentication (admin only)
    const adminRoutes = [
        "/admin",
    ];
    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

    // Public routes that don't require authentication
    const publicRoutes = ["/login", "/api/auth", "/", "/portfolio"];
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

    // API routes for public access (portfolio data)
    const publicApiRoutes = [
        "/api/projects",
        "/api/certifications",
        "/api/volunteering",
        "/api/awards",
        "/api/languages",
        "/api/settings/notice"
    ];
    const isPublicApi = publicApiRoutes.some((route) => pathname.startsWith(route));

    // Allow public routes
    if (isPublicRoute || isPublicApi) {
        // Redirect to admin dashboard if already logged in and trying to access login
        if (isLoggedIn && pathname === "/login") {
            return NextResponse.redirect(new URL("/admin", nextUrl));
        }
        return NextResponse.next();
    }

    // Require authentication only for admin routes
    if (isAdminRoute && !isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Check for password reset requirement (admin only)
    if (isAdminRoute && req.auth?.user?.mustResetPassword && pathname !== "/admin/profile/reset-password") {
        return NextResponse.redirect(new URL("/admin/profile/reset-password", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    // Only protect admin routes
    matcher: [
        "/admin/:path*",
        "/login",
    ],
};
