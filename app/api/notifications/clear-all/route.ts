import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// DELETE — Supprimer toutes les notifications de l'utilisateur
export async function DELETE(_req: NextRequest) {
  try {
    const user = requireAuth(_req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { count } = await prisma.notification.deleteMany({
      where: { userId: user.userId },
    });

    return NextResponse.json({
      message: "Notifications effacées",
      deletedCount: count,
    });
  } catch (error) {
    console.error("[DELETE /api/notifications/clear-all]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
