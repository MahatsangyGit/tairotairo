import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";

// GET - Liste des notifications + compteur non lues
export const GET = withApiHandler("GET /api/notifications", async (req) => {
  const user = await requireAuthOrThrow(req);

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const unreadOnly = searchParams.get("unread") === "true";

  const where = {
    userId: user.userId,
    ...(unreadOnly && { read: false }),
  };

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({
      where: { userId: user.userId, read: false },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
});
