import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push";
import {
  parseBody,
  parseJsonBody,
  pushSubscribeSchema,
  pushUnsubscribeSchema,
} from "@/lib/api-schemas";
import { withApiHandler } from "@/lib/api-handler";

// GET - Clé publique VAPID pour le client
export const GET = withApiHandler("GET /api/notifications/push/subscribe", async () => {
  const publicKey = getVapidPublicKey();
  return NextResponse.json({
    publicKey,
    configured: isPushConfigured(),
  });
});

// POST - Enregistrer un abonnement push
export const POST = withApiHandler("POST /api/notifications/push/subscribe", async (req) => {
  const user = await requireAuthOrThrow(req);

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
});

// DELETE - Désactiver push pour cet endpoint
export const DELETE = withApiHandler("DELETE /api/notifications/push/subscribe", async (req) => {
  const user = await requireAuthOrThrow(req);

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
});
