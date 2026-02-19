import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { volunteeringSchema, paginationSchema } from "@/lib/validations";
import { publicCorsHeaders, publicOptionsResponse } from "@/lib/publicCors";

export function OPTIONS(request: NextRequest) {
    return publicOptionsResponse(request);
}

// GET /api/volunteering - List all volunteering entries
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const requestedStatus = searchParams.get("status");

        // Allow public access ONLY for fetching PUBLISHED entries
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

        const params = paginationSchema.parse({
            page: isNaN(page) ? 1 : page,
            limit: isNaN(limit) ? 10 : limit,
            search: searchParams.get("search") || undefined,
            status: searchParams.get("status") || undefined,
            sortBy: searchParams.get("sortBy") || "updatedAt",
            sortOrder: searchParams.get("sortOrder") || "desc",
        });

        const where: any = {};

        if (params.search) {
            where.OR = [
                { organization: { contains: params.search, mode: "insensitive" } },
                { role: { contains: params.search, mode: "insensitive" } },
                { description: { contains: params.search, mode: "insensitive" } },
            ];
        }

        if (params.status) {
            where.status = params.status;
        }

        // Force status filter for public requests
        if (isPublicRequest) {
            where.status = "PUBLISHED";
        }

        const orderBy: any = {};
        orderBy[params.sortBy || "updatedAt"] = params.sortOrder;

        const [volunteering, total] = await Promise.all([
            prisma.volunteering.findMany({
                where,
                include: {
                    createdBy: { select: { displayName: true } },
                    updatedBy: { select: { displayName: true } },
                },
                orderBy,
                skip: (params.page - 1) * params.limit,
                take: params.limit,
            }),
            prisma.volunteering.count({ where }),
        ]);

        const parsedVolunteering = volunteering.map(entry => ({
            ...entry,
            tags: JSON.parse(entry.tags),
        }));

        return NextResponse.json({
            data: parsedVolunteering,
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
        console.error("Error fetching volunteering:", error);
        return NextResponse.json(
            { message: "Errore durante il recupero del volontariato", error: String(error) },
            { status: 500, headers: publicCorsHeaders(request) }
        );
    }
}

// POST /api/volunteering - Create a new volunteering entry
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
        const data = volunteeringSchema.parse(body);

        // Create volunteering entry
        const entry = await prisma.volunteering.create({
            data: {
                organization: data.organization,
                role: data.role,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : null,
                isCurrent: data.isCurrent,
                location: data.location,
                description: data.description,
                impact: data.impact,
                link: data.link,
                tags: JSON.stringify(data.tags),
                status: data.status,
                order: data.order,
                createdById: session.user.id,
            },
        });

        // Log action
        await logAudit("CREATE", "VOLUNTEERING", entry.id, {
            after: { organization: entry.organization, role: entry.role, status: entry.status },
        });

        return NextResponse.json(entry, { status: 201 });
    } catch (error: any) {
        console.error("Error creating volunteering:", error);

        if (error?.name === "ZodError") {
            return NextResponse.json(
                { message: "Dati non validi", errors: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Errore durante la creazione della voce di volontariato", detail: String(error) },
            { status: 500 }
        );
    }
}
