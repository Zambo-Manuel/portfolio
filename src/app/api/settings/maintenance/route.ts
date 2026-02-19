import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { maintenanceSchema } from "@/lib/validations";
import { publicCorsHeaders, publicOptionsResponse } from "@/lib/publicCors";

export function OPTIONS(request: NextRequest) {
  return publicOptionsResponse(request);
}

// GET /api/settings/maintenance - Get maintenance mode (Public)
export async function GET(request: NextRequest) {
  try {
    const maintenance = await prisma.siteMaintenance.findUnique({
      where: { id: "global" },
    });

    return NextResponse.json(
      maintenance || {
        id: "global",
        enabled: false,
        title: "Manutenzione in corso",
        message: "Stiamo effettuando alcuni aggiornamenti. Torna tra poco.",
      },
      { headers: publicCorsHeaders(request) }
    );
  } catch (error) {
    console.error("Error fetching maintenance:", error);
    return NextResponse.json(
      { message: "Errore durante il recupero delle impostazioni di manutenzione" },
      { status: 500, headers: publicCorsHeaders(request) }
    );
  }
}

// PUT /api/settings/maintenance - Update maintenance mode (Protected)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Non autorizzato" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "EDIT_SETTINGS")) {
      return NextResponse.json({ message: "Permesso negato" }, { status: 403 });
    }

    const body = await request.json();
    const data = maintenanceSchema.parse(body);

    const existing = await prisma.siteMaintenance.findUnique({
      where: { id: "global" },
    });

    const maintenance = existing
      ? await prisma.siteMaintenance.update({
          where: { id: "global" },
          data: {
            enabled: !!data.enabled,
            title: data.title,
            message: data.message,
          },
        })
      : await prisma.siteMaintenance.create({
          data: {
            id: "global",
            enabled: !!data.enabled,
            title: data.title,
            message: data.message,
          },
        });

    // Treat maintenance as a SETTINGS change for audit purposes
    await logAudit(existing ? "UPDATE" : "CREATE", "SETTINGS", "maintenance", {
      after: { enabled: maintenance.enabled, title: maintenance.title },
    });

    return NextResponse.json(maintenance);
  } catch (error: any) {
    console.error("Error updating maintenance:", error);

    if (error?.name === "ZodError") {
      return NextResponse.json(
        { message: "Dati non validi", errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Errore durante l'aggiornamento della manutenzione" },
      { status: 500 }
    );
  }
}
