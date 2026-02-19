import { NextRequest, NextResponse } from "next/server";
import { auth, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { createUserSchema, paginationSchema } from "@/lib/validations";

// GET /api/users - List all users
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ message: "Non autorizzato" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, "VIEW_USERS")) {
            return NextResponse.json({ message: "Permesso negato" }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const params = paginationSchema.parse({
            page: searchParams.get("page"),
            limit: searchParams.get("limit"),
            search: searchParams.get("search"),
        });

        const where = params.search
            ? {
                OR: [
                    { username: { contains: params.search, mode: "insensitive" as const } },
                    { email: { contains: params.search, mode: "insensitive" as const } },
                    { displayName: { contains: params.search, mode: "insensitive" as const } },
                ],
            }
            : {};

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
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
                orderBy: { createdAt: "desc" },
                skip: (params.page - 1) * params.limit,
                take: params.limit,
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            data: users,
            pagination: {
                page: params.page,
                limit: params.limit,
                total,
                totalPages: Math.ceil(total / params.limit),
            },
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { message: "Errore durante il recupero degli utenti" },
            { status: 500 }
        );
    }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ message: "Non autorizzato" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, "CREATE_USER")) {
            return NextResponse.json({ message: "Permesso negato" }, { status: 403 });
        }

        const body = await request.json();
        const data = createUserSchema.parse(body);

        // Check if username or email already exists
        const existing = await prisma.user.findFirst({
            where: {
                OR: [{ username: data.username }, { email: data.email }],
            },
        });

        if (existing) {
            if (existing.username === data.username) {
                return NextResponse.json(
                    { message: "Username già in uso" },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { message: "Email già in uso" },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(data.password);

        // Create user
        const user = await prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                displayName: data.displayName,
                passwordHash,
                role: data.role,
                mustResetPassword: data.mustResetPassword ?? false,
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

        // Log action
        await logAudit("CREATE", "USER", user.id, {
            after: { username: user.username, email: user.email, role: user.role },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error: any) {
        console.error("Error creating user:", error);

        if (error?.name === "ZodError") {
            return NextResponse.json(
                { message: "Dati non validi", errors: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Errore durante la creazione dell'utente" },
            { status: 500 }
        );
    }
}
