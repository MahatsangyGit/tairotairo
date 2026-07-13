import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";

export const PATCH = withApiHandler(
  "PATCH /api/notifications/[id]",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);

    const { id } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== user.userId) {
      throwNotFound("Notification introuvable");
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ notification: updated });
  }
);
