import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow, requireRole } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import { deleteKycFile, readKycFile } from "@/lib/kyc-storage";
import { getProviderKycPayload, resetProviderKycIfIncomplete } from "@/lib/provider-kyc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  "GET /api/provider/kyc/documents/[id]",
  async (req, ctx) => {
    const auth = await requireAuthOrThrow(req);
    const { id } = await ctx.params;

    const doc = await prisma.providerKycDocument.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }

    if (doc.userId !== auth.userId && auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const buffer = await readKycFile(doc.userId, doc.storedName);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.originalName)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }
);

export const DELETE = withApiHandler(
  "DELETE /api/provider/kyc/documents/[id]",
  async (req, ctx) => {
    const auth = await requireAuthOrThrow(req);
    requireRole(auth, ["PROVIDER", "ADMIN"], "Accès refusé");

    const { id } = await ctx.params;
    const doc = await prisma.providerKycDocument.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }

    if (doc.userId !== auth.userId && auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    await deleteKycFile(doc.userId, doc.storedName);
    await prisma.providerKycDocument.delete({ where: { id } });

    await prisma.user.update({
      where: { id: doc.userId },
      data: { kycStatus: "NOT_STARTED", kycSubmittedAt: null },
    });

    await resetProviderKycIfIncomplete(doc.userId);

    const kyc = await getProviderKycPayload(doc.userId);
    return NextResponse.json({ message: "Document supprimé", kyc });
  }
);
