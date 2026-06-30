import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: { userId: user.userId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ message: "Toutes les notifications sont lues" });
  } catch (error) {
    console.error("[PATCH /api/notifications/read-all]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
