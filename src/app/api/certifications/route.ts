import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { certificationSchema, paginationSchema } from "@/lib/validations";
import { publicCorsHeaders, publicOptionsResponse } from "@/lib/publicCors";

export function OPTIONS(request: NextRequest) {
    return publicOptionsResponse(request);
}

// GET /api/certifications - List all certifications
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const requestedStatus = searchParams.get("status");

        // Allow public access ONLY for fetching PUBLISHED certifications
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
                { issuer: { contains: params.search, mode: "insensitive" } },
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

        const [certifications, total] = await Promise.all([
            prisma.certification.findMany({
                where,
                include: {
                    createdBy: { select: { displayName: true } },
                    updatedBy: { select: { displayName: true } },
                },
                orderBy,
                skip: (params.page - 1) * params.limit,
                take: params.limit,
            }),
            prisma.certification.count({ where }),
        ]);

        const parsedCertifications = certifications.map(cert => ({
            ...cert,
            skills: JSON.parse(cert.skills),
        }));

        return NextResponse.json({
            data: parsedCertifications,
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
        console.error("Error fetching certifications:", error);
        return NextResponse.json(
            { message: "Errore durante il recupero delle certificazioni", error: String(error) },
            { status: 500, headers: publicCorsHeaders(request) }
        );
    }
}

// POST /api/certifications - Create a new certification
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
        const data = certificationSchema.parse(body);

        // Create certification
        const certification = await prisma.certification.create({
            data: {
                title: data.title,
                issuer: data.issuer,
                issuedAt: new Date(data.issuedAt),
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
                credentialId: data.credentialId,
                verificationLink: data.verificationLink,
                description: data.description,
                skills: JSON.stringify(data.skills),
                attachmentPath: data.attachmentPath,
                status: data.status,
                order: data.order,
                createdById: session.user.id,
            },
        });

        // Log action
        await logAudit("CREATE", "CERTIFICATION", certification.id, {
            after: { title: certification.title, issuer: certification.issuer, status: certification.status },
        });

        return NextResponse.json(certification, { status: 201 });
    } catch (error: any) {
        console.error("Error creating certification:", error);

        if (error?.name === "ZodError") {
            return NextResponse.json(
                { message: "Dati non validi", errors: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Errore durante la creazione della certificazione", detail: String(error) },
            { status: 500 }
        );
    }
}
