import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) {
      return NextResponse.json({ unreadTotal: 0 });
    }

    const unreadTotal = await prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: auth.userId },
        conversation: {
          OR: [{ clientId: auth.userId }, { providerId: auth.userId }],
        },
      },
    });

    return NextResponse.json({ unreadTotal });
  } catch (error) {
    console.error("[GET /api/conversations/unread-count]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
