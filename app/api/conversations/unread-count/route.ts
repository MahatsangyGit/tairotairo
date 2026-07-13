import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  "GET /api/conversations/unread-count",
  async (req) => {
    const auth = await requireAuth(req);
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
  }
);
