import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const prefs = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { notifyEmail: true, notifyPush: true },
    });

    return NextResponse.json({ preferences: prefs });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { notifyEmail, notifyPush } = await req.json();

    const preferences = await prisma.user.update({
      where: { id: user.userId },
      data: {
        ...(notifyEmail !== undefined && { notifyEmail: Boolean(notifyEmail) }),
        ...(notifyPush !== undefined && { notifyPush: Boolean(notifyPush) }),
      },
      select: { notifyEmail: true, notifyPush: true },
    });

    return NextResponse.json({ message: "Préférences mises à jour", preferences });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
