import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { readPortfolioImage } from "@/lib/portfolio-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const item = await prisma.providerPortfolioItem.findUnique({
      where: { id },
      select: { storedName: true },
    });

    if (!item || item.storedName === "pending") {
      return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
    }

    const file = await readPortfolioImage(id, item.storedName);
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
    console.error("[GET /api/provider/portfolio/[id]/image]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
