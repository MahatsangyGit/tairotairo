import webpush from "web-push";
import prisma from "@/lib/prisma";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ?? "mailto:contact@tairotairo.mg";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured || !VAPID_PUBLIC || !VAPID_PRIVATE) return false;

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  vapidConfigured = true;
  return true;
}

export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC && VAPID_PRIVATE);
}

export function getVapidPublicKey(): string | null {
  return VAPID_PUBLIC ?? null;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  if (!ensureVapid()) {
    console.info("[push:dev]", { userId, ...payload });
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          message
        );
      } catch (error: unknown) {
        const statusCode =
          error && typeof error === "object" && "statusCode" in error
            ? (error as { statusCode: number }).statusCode
            : 0;

        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          console.error("[sendPushToUser]", error);
        }
      }
    })
  );
}
