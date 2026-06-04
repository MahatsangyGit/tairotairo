import { NextRequest, NextResponse } from "next/server";
import { readAvatarFile } from "@/lib/avatar-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const file = await readAvatarFile(id);

    if (!file) {
      return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.mime,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[GET /api/users/[id]/avatar]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
