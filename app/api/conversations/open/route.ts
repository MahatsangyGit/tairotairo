import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  conversationPath,
  resolveConversationPair,
  upsertConversationForPair,
} from "@/lib/conversations";

// POST — Ouvrir ou créer une conversation (réservation, ou contact direct)
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const pair = await resolveConversationPair({
      userId: auth.userId,
      role: auth.role,
      bookingId: body.bookingId,
      providerId: body.providerId,
      clientId: body.clientId,
    });

    if ("error" in pair) {
      return NextResponse.json({ error: pair.error }, { status: pair.status });
    }

    const role = auth.role === "PROVIDER" ? "PROVIDER" : "CLIENT";
    const conversation = await upsertConversationForPair(
      pair.clientId,
      pair.providerId
    );

    return NextResponse.json({
      conversationId: conversation.id,
      href: conversationPath(role, conversation.id),
    });
  } catch (error) {
    console.error("[POST /api/conversations/open]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
