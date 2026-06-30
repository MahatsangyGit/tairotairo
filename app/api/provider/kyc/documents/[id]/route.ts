import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { deleteKycFile, readKycFile } from "@/lib/kyc-storage";
import { getProviderKycPayload, resetProviderKycIfIncomplete } from "@/lib/provider-kyc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
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
  } catch (error) {
    console.error("[GET /api/provider/kyc/documents/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (auth.role !== "PROVIDER" && auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
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
  } catch (error) {
    console.error("[DELETE /api/provider/kyc/documents/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
