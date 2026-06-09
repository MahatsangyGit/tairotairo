import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  deleteListingCoverFiles,
  readListingCoverFile,
  saveListingCoverFile,
  validateListingCoverFile,
} from "@/lib/listing-cover-storage";
import { buildListingCoverUrl } from "@/lib/listing-cover";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function loadOwnedRequest(id: string, userId: string, role: string) {
  const request = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!request) return { error: "Demande introuvable", status: 404 as const };
  if (request.clientId !== userId && role !== "ADMIN") {
    return { error: "Accès refusé", status: 403 as const };
  }
  return { request };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      select: { coverImageMime: true },
    });

    if (!request?.coverImageMime) {
      return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
    }

    const file = await readListingCoverFile("request", id);
    if (!file) {
      return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.mime,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("[GET /api/requests/[id]/cover]", error);
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
    const owned = await loadOwnedRequest(id, auth.userId, auth.role);
    if ("error" in owned) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
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

    await saveListingCoverFile("request", id, buffer, validation.mime);

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: { coverImageMime: validation.mime },
    });

    return NextResponse.json({
      message: "Photo enregistrée",
      coverImageUrl: buildListingCoverUrl("request", id, Date.now()),
      request: updated,
    });
  } catch (error) {
    console.error("[POST /api/requests/[id]/cover]", error);
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
    const owned = await loadOwnedRequest(id, auth.userId, auth.role);
    if ("error" in owned) {
      return NextResponse.json({ error: owned.error }, { status: owned.status });
    }

    await deleteListingCoverFiles("request", id);

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: { coverImageMime: null },
    });

    return NextResponse.json({
      message: "Photo supprimée",
      request: updated,
    });
  } catch (error) {
    console.error("[DELETE /api/requests/[id]/cover]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
