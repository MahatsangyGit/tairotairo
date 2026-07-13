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

// GET — Détail d'une conversation et ses messages
export const GET = withApiHandler(
  "GET /api/conversations/[id]",
  async (req, { params }) => {
    const auth = await requireAuthOrThrow(req);
    const { id } = await params;
    const requestResponseId =
      req.nextUrl.searchParams.get("response") ?? undefined;
    const serviceId = req.nextUrl.searchParams.get("service") ?? undefined;

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

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

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
      messages: messages.map((m) => serializeMessage(m, auth.userId)),
    });
  }
);
