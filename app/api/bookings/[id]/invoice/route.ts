import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { withApiHandler, throwForbidden, throwNotFound } from "@/lib/api-handler";
import { getInvoiceData } from "@/lib/invoice";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";

export const dynamic = "force-dynamic";

// GET — Télécharger la facture PDF d'une réservation (après validation + paiement).
// Accessible au prestataire de la réservation, au client, et à l'admin.
export const GET = withApiHandler(
  "GET /api/bookings/[id]/invoice",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);

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
      throwNotFound("Réservation introuvable");
    }

    const isClient = booking.clientId === user.userId;
    const isProvider = booking.providerId === user.userId;
    const isAdmin = user.role === "ADMIN";

    if (!isClient && !isProvider && !isAdmin) {
      throwForbidden("Vous n'avez pas accès à cette facture");
    }

    const audience: "client" | "provider" =
      isClient && !isProvider ? "client" : "provider";

    const data = await getInvoiceData(id, audience);
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
    const filename =
      data.audience === "client"
        ? `facture-client-${data.invoiceNumber}.pdf`
        : `facture-${data.invoiceNumber}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }
);
