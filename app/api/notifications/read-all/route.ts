import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";

export const PATCH = withApiHandler("PATCH /api/notifications/read-all", async (req) => {
  const user = await requireAuthOrThrow(req);

  await prisma.notification.updateMany({
    where: { userId: user.userId, read: false },
    data: { read: true },
  });

  return NextResponse.json({ message: "Toutes les notifications sont lues" });
});
