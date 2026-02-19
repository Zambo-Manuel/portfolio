import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { projectSchema, paginationSchema } from "@/lib/validations";
import { publicCorsHeaders, publicOptionsResponse } from "@/lib/publicCors";

export function OPTIONS(request: NextRequest) {
    // Allow the static portfolio to call the public GET endpoint cross-origin
    return publicOptionsResponse(request);
}

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const requestedStatus = searchParams.get("status");

        // Allow public access ONLY for fetching PUBLISHED projects
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
                { title: { contains: params.search, mode: "insensitive" } },
                { slug: { contains: params.search, mode: "insensitive" } },
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

        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
                include: {
                    createdBy: { select: { displayName: true } },
                    updatedBy: { select: { displayName: true } },
                },
                orderBy,
                skip: (params.page - 1) * params.limit,
                take: params.limit,
            }),
            prisma.project.count({ where }),
        ]);

        const parsedProjects = projects.map(project => ({
            ...project,
            tags: JSON.parse(project.tags),
            techStack: JSON.parse(project.techStack),
            images: JSON.parse(project.images),
        }));

        return NextResponse.json({
            data: parsedProjects,
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
        console.error("Error fetching projects:", error);
        return NextResponse.json(
            { message: "Errore durante il recupero dei progetti", error: String(error), stack: error instanceof Error ? error.stack : undefined },
            { status: 500, headers: publicCorsHeaders(request) }
        );
    }
}

// POST /api/projects - Create a new project
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
        const data = projectSchema.parse(body);

        // Check if slug already exists
        const existing = await prisma.project.findUnique({
            where: { slug: data.slug },
        });

        if (existing) {
            return NextResponse.json({ message: "Slug già in uso" }, { status: 400 });
        }

        // Create project
        const project = await prisma.project.create({
            data: {
                slug: data.slug,
                title: data.title,
                mainLink: data.mainLink,
                description: data.description,
                tags: JSON.stringify(data.tags),
                techStack: JSON.stringify(data.techStack),
                images: JSON.stringify(data.images),
                coverImage: data.coverImage,
                repoLink: data.repoLink || null,
                roleActivities: data.roleActivities,
                results: data.results,
                status: data.status,
                featured: data.featured,
                order: data.order,
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null,
                createdById: session.user.id,
            },
        });

        // Log action
        await logAudit("CREATE", "PROJECT", project.id, {
            after: { title: project.title, slug: project.slug, status: project.status },
        });

        return NextResponse.json(project, { status: 201 });
    } catch (error: any) {
        console.error("Error creating project:", error);

            if (error?.name === "ZodError") {
            return NextResponse.json(
                { message: "Dati non validi", errors: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Errore durante la creazione del progetto", detail: String(error) },
            { status: 500 }
        );
    }
}
