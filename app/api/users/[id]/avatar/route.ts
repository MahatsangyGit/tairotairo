import { NextRequest, NextResponse } from "next/server";
import { readAvatarFile } from "@/lib/avatar-storage";
import {
  createImageResponse,
  isVersionedImageRequest,
} from "@/lib/image-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const file = await readAvatarFile(id);

    if (!file) {
      return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });
    }

    return createImageResponse(req, file.buffer, file.mime, {
      versioned: isVersionedImageRequest(req),
    });
  } catch (error) {
    console.error("[GET /api/users/[id]/avatar]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
