import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow, requireEmailVerified } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import {
  conversationPath,
  resolveConversationPair,
  upsertConversationForPair,
} from "@/lib/conversations";
import {
  parseJsonBody,
  parseBody,
  openConversationSchema,
} from "@/lib/api-schemas";

// POST — Ouvrir ou créer une conversation (réservation, ou contact direct)
export const POST = withApiHandler(
  "POST /api/conversations/open",
  async (req) => {
    const auth = await requireAuthOrThrow(req);

    await requireEmailVerified(auth);

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(openConversationSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const pair = await resolveConversationPair({
      userId: auth.userId,
      role: auth.role,
      bookingId: body.bookingId,
      providerId: body.providerId,
      clientId: body.clientId,
      requestResponseId: body.requestResponseId,
      serviceId: body.serviceId,
    });

    if ("error" in pair) {
      return NextResponse.json({ error: pair.error }, { status: pair.status });
    }

    const role = auth.role === "PROVIDER" ? "PROVIDER" : "CLIENT";
    const conversation = await upsertConversationForPair(
      pair.clientId,
      pair.providerId
    );

    let href = conversationPath(role, conversation.id);
    if (body.requestResponseId) {
      href += `?response=${body.requestResponseId}`;
    } else if (body.serviceId) {
      href += `?service=${body.serviceId}`;
    }

    return NextResponse.json({
      conversationId: conversation.id,
      href,
    });
  }
);
