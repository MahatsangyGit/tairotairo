import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  notificationPreferencesSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

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
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

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
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
