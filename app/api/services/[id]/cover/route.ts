import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertProviderKycApproved } from "@/lib/provider-kyc";
import {
  deleteListingCoverFiles,
  readListingCoverFile,
  saveListingCoverFile,
  validateListingCoverFile,
} from "@/lib/listing-cover-storage";
import { buildListingCoverUrl } from "@/lib/listing-cover";
import {
  createImageResponse,
  isVersionedImageRequest,
} from "@/lib/image-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function loadOwnedService(id: string, userId: string, role: string) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) return { error: "Service introuvable", status: 404 as const };
  if (service.providerId !== userId && role !== "ADMIN") {
    return { error: "Accès refusé", status: 403 as const };
  }
  return { service };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const service = await prisma.service.findUnique({
      where: { id },
      select: { coverImageMime: true, available: true },
    });

    if (!service?.coverImageMime) {
      return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
    }

    const file = await readListingCoverFile("service", id);
    if (!file) {
      return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
    }

    return createImageResponse(req, file.buffer, file.mime, {
      versioned: isVersionedImageRequest(req),
    });
  } catch (error) {
    console.error("[GET /api/services/[id]/cover]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const owned = await loadOwnedService(id, auth.userId, auth.role);
    if ("error" in owned) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    if (auth.role === "PROVIDER") {
      const kycCheck = await assertProviderKycApproved(auth.userId, auth.role);
      if (!kycCheck.ok) {
        return NextResponse.json(
          { error: kycCheck.error },
          { status: kycCheck.status }
        );
      }
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image requise" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateListingCoverFile(file, buffer);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await saveListingCoverFile("service", id, buffer, validation.mime);

    const updated = await prisma.service.update({
      where: { id },
      data: { coverImageMime: validation.mime },
    });

    return NextResponse.json({
      message: "Photo enregistrée",
      coverImageUrl: buildListingCoverUrl("service", id, Date.now()),
      service: updated,
    });
  } catch (error) {
    console.error("[POST /api/services/[id]/cover]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const owned = await loadOwnedService(id, auth.userId, auth.role);
    if ("error" in owned) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    await deleteListingCoverFiles("service", id);

    const updated = await prisma.service.update({
      where: { id },
      data: { coverImageMime: null },
    });

    return NextResponse.json({
      message: "Photo supprimée",
      service: updated,
    });
  } catch (error) {
    console.error("[DELETE /api/services/[id]/cover]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
