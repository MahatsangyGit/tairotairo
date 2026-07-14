import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import {
  getConversationContext,
  getConversationForParticipant,
  getCounterpartyFromConversation,
} from "@/lib/conversations";
import { resolveNegotiationForConversation } from "@/lib/price-negotiation";
import { serializeMessage } from "@/lib/message-serialize";
import { publishInboxChanged } from "@/lib/realtime/publish";
import {
  decodeTimeIdCursor,
  encodeTimeIdCursor,
  parsePageLimit,
} from "@/lib/keyset-cursor";
import type { Prisma } from "@/generated/prisma/client";

// GET — Détail d'une conversation et ses messages (paginés, plus récents d'abord)
export const GET = withApiHandler(
  "GET /api/conversations/[id]",
  async (req, { params }) => {
    const auth = await requireAuthOrThrow(req);
    const { id } = await params;
    const requestResponseId =
      req.nextUrl.searchParams.get("response") ?? undefined;
    const serviceId = req.nextUrl.searchParams.get("service") ?? undefined;
    const limit = parsePageLimit(req.nextUrl.searchParams.get("limit"), {
      default: 50,
      max: 100,
    });
    const cursor = decodeTimeIdCursor(req.nextUrl.searchParams.get("cursor"));

    const conversation = await getConversationForParticipant(id, auth.userId);

    if (!conversation) {
      throwNotFound("Conversation introuvable");
    }

    const markedRead = await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: auth.userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    if (markedRead.count > 0) {
      publishInboxChanged(auth.userId);
    }

    const olderThanCursor: Prisma.MessageWhereInput | undefined = cursor
      ? {
          OR: [
            { createdAt: { lt: cursor.at } },
            { createdAt: cursor.at, id: { lt: cursor.id } },
          ],
        }
      : undefined;

    const messageRows = await prisma.message.findMany({
      where: {
        conversationId: id,
        ...(olderThanCursor ? olderThanCursor : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    const hasMore = messageRows.length > limit;
    const pageDesc = hasMore ? messageRows.slice(0, limit) : messageRows;
    const pageAsc = [...pageDesc].reverse();

    const oldest = pageAsc[0];
    const nextCursor =
      hasMore && oldest
        ? encodeTimeIdCursor(oldest.createdAt, oldest.id)
        : null;

    const counterparty = getCounterpartyFromConversation(
      conversation,
      auth.userId
    );
    const context = await getConversationContext(
      conversation.clientId,
      conversation.providerId
    );

    const negotiation = await resolveNegotiationForConversation(
      id,
      conversation.clientId,
      conversation.providerId,
      { requestResponseId, serviceId }
    );

    const subject = negotiation
      ? negotiation.source === "service"
        ? negotiation.serviceTitle
        : negotiation.requestTitle
      : context.subject;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        bookingId: negotiation?.bookingId ?? context.bookingId,
        subject,
        isDirect: negotiation ? false : context.isDirect,
        bookingStatus: negotiation?.bookingStatus ?? context.bookingStatus,
        negotiation,
        counterparty: {
          id: counterparty.id,
          name: counterparty.name,
          avatar: counterparty.avatar,
        },
      },
      messages: pageAsc.map((m) => serializeMessage(m, auth.userId)),
      nextCursor,
      hasMore,
    });
  }
);
