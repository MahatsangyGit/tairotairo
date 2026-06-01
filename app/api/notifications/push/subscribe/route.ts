import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push";

// GET - Clé publique VAPID pour le client
export async function GET() {
  const publicKey = getVapidPublicKey();
  return NextResponse.json({
    publicKey,
    configured: isPushConfigured(),
  });
}

// POST - Enregistrer un abonnement push
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { endpoint, keys } = await req.json();

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Abonnement push invalide" },
        { status: 400 }
      );
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: user.userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      update: {
        userId: user.userId,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return NextResponse.json({ message: "Notifications push activées" });
  } catch (error) {
    console.error("[POST /api/notifications/push/subscribe]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Désactiver push pour cet endpoint
export async function DELETE(req: NextRequest) {
  try {
    const user = requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { endpoint } = await req.json();

    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: { userId: user.userId, endpoint },
      });
    } else {
      await prisma.pushSubscription.deleteMany({
        where: { userId: user.userId },
      });
    }

    return NextResponse.json({ message: "Notifications push désactivées" });
  } catch (error) {
    console.error("[DELETE /api/notifications/push/subscribe]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
