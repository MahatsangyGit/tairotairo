import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import {
  notificationPreferencesSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler("GET /api/notifications/preferences", async (req) => {
  const user = await requireAuthOrThrow(req);

  const prefs = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { notifyEmail: true, notifyPush: true },
  });

  return NextResponse.json({ preferences: prefs });
});

export const PATCH = withApiHandler("PATCH /api/notifications/preferences", async (req) => {
  const user = await requireAuthOrThrow(req);

  const json = await parseJsonBody(req);
  if (!json.ok) return json.response;

  const parsed = parseBody(notificationPreferencesSchema, json.body);
  if (!parsed.ok) return parsed.response;

  const { notifyEmail, notifyPush } = parsed.data;

  const preferences = await prisma.user.update({
    where: { id: user.userId },
    data: {
      ...(notifyEmail !== undefined && { notifyEmail }),
      ...(notifyPush !== undefined && { notifyPush }),
    },
    select: { notifyEmail: true, notifyPush: true },
  });

  return NextResponse.json({ message: "Préférences mises à jour", preferences });
});
