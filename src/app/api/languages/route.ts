import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { languageSchema, paginationSchema } from "@/lib/validations";
import { publicCorsHeaders, publicOptionsResponse } from "@/lib/publicCors";

export function OPTIONS(request: NextRequest) {
    return publicOptionsResponse(request);
}

// GET /api/languages - List all languages
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const requestedStatus = searchParams.get("status");

        // Allow public access ONLY for fetching visible languages
        const isPublicRequest = requestedStatus === "PUBLISHED";

        const session = await auth();

        if (!isPublicRequest) {
            if (!session?.user) {
                return NextResponse.json({ message: "Non autorizzato" }, { status: 401 });
            }

            if (!hasPermission(session.user.role, "VIEW_CONTENT")) {
                return NextResponse.json({ message: "Permesso negato" }, { status: 403 });
            }
        }

        const rawPage = searchParams.get("page");
        const rawLimit = searchParams.get("limit");

        // Parse pagination params with defaults before Zod validation
        const page = rawPage ? parseInt(rawPage) : 1;
        const limit = rawLimit ? parseInt(rawLimit) : 10;

        // NOTE: Languages don't have a "status" field in the DB; visibility is controlled by the
        // boolean `visible`. We still accept `status=PUBLISHED` as a convenience for the
        // public portfolio fetch.
        const params = paginationSchema.parse({
            page: isNaN(page) ? 1 : page,
            limit: isNaN(limit) ? 10 : limit,
            search: searchParams.get("search") || undefined,
            status: undefined,
            sortBy: searchParams.get("sortBy") || "order",
            sortOrder: searchParams.get("sortOrder") || "asc",
        });

        const where: any = {};

        if (params.search) {
            where.OR = [
                { name: { contains: params.search, mode: "insensitive" } },
                { level: { contains: params.search, mode: "insensitive" } },
                { notes: { contains: params.search, mode: "insensitive" } },
            ];
        }

        // Force visibility filter for public requests
        if (isPublicRequest) {
            where.visible = true;
        }

        const orderBy: any = {};
        orderBy[params.sortBy || "order"] = params.sortOrder;

        const [languages, total] = await Promise.all([
            prisma.language.findMany({
                where,
                include: {
                    createdBy: { select: { displayName: true } },
                    updatedBy: { select: { displayName: true } },
                },
                orderBy,
                skip: (params.page - 1) * params.limit,
                take: params.limit,
            }),
            prisma.language.count({ where }),
        ]);

        return NextResponse.json({
            data: languages,
            pagination: {
                page: params.page,
                limit: params.limit,
                total,
                totalPages: Math.ceil(total / params.limit),
            },
        }, {
            headers: isPublicRequest ? publicCorsHeaders(request) : undefined,
        });
    } catch (error) {
        console.error("Error fetching languages:", error);
        return NextResponse.json(
            { message: "Errore durante il recupero delle lingue", error: String(error) },
            { status: 500, headers: publicCorsHeaders(request) }
        );
    }
}

// POST /api/languages - Create a new language
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ message: "Non autorizzato" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, "CREATE_CONTENT")) {
            return NextResponse.json({ message: "Permesso negato" }, { status: 403 });
        }

        const body = await request.json();
        const data = languageSchema.parse(body);

        // Create language entry
        const language = await prisma.language.create({
            data: {
                name: data.name,
                level: data.level,
                notes: data.notes,
                certificationId: data.certificationId,
                visible: data.visible ?? true,
                order: data.order,
                createdById: session.user.id,
            },
        });

        // Log action
        await logAudit("CREATE", "LANGUAGE", language.id, {
            after: { name: language.name, level: language.level, visible: language.visible },
        });

        return NextResponse.json(language, { status: 201 });
    } catch (error: any) {
        console.error("Error creating language:", error);

            if (error?.name === "ZodError") {
            return NextResponse.json(
                { message: "Dati non validi", errors: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Errore durante la creazione della lingua" },
            { status: 500 }
        );
    }
}
