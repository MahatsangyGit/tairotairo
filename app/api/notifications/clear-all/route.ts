import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";

// DELETE — Supprimer toutes les notifications de l'utilisateur
export const DELETE = withApiHandler("DELETE /api/notifications/clear-all", async (req) => {
  const user = await requireAuthOrThrow(req);

  const { count } = await prisma.notification.deleteMany({
    where: { userId: user.userId },
  });

  return NextResponse.json({
    message: "Notifications effacées",
    deletedCount: count,
  });
});
