import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push";
import {
  parseBody,
  parseJsonBody,
  pushSubscribeSchema,
  pushUnsubscribeSchema,
} from "@/lib/api-schemas";

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
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(pushSubscribeSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { endpoint, keys } = parsed.data;

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
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(pushUnsubscribeSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { endpoint } = parsed.data;

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
