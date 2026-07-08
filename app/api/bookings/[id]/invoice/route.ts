import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getInvoiceData } from "@/lib/invoice";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";

export const dynamic = "force-dynamic";

// GET — Télécharger la facture PDF d'une réservation (après validation + paiement).
// Accessible au prestataire de la réservation, au client, et à l'admin.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        clientId: true,
        providerId: true,
        transaction: {
          select: {
            id: true,
            status: true,
            releasedAt: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    const isClient = booking.clientId === user.userId;
    const isProvider = booking.providerId === user.userId;
    const isAdmin = user.role === "ADMIN";

    if (!isClient && !isProvider && !isAdmin) {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à cette facture" },
        { status: 403 }
      );
    }

    const data = await getInvoiceData(id);
    if (!data) {
      return NextResponse.json(
        {
          error:
            "Facture indisponible : la prestation doit être validée et le paiement libéré",
        },
        { status: 409 }
      );
    }

    const pdf = generateInvoicePdf(data);
    const filename = `facture-${data.invoiceNumber}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[GET /api/bookings/[id]/invoice]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
