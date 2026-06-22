import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  getConversationContext,
  getConversationForParticipant,
  getCounterpartyFromConversation,
} from "@/lib/conversations";
import { resolveNegotiationForConversation } from "@/lib/price-negotiation";
import { serializeMessage } from "@/lib/message-serialize";
import { publishInboxChanged } from "@/lib/realtime/publish";

// GET — Détail d'une conversation et ses messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const requestResponseId =
      req.nextUrl.searchParams.get("response") ?? undefined;
    const serviceId = req.nextUrl.searchParams.get("service") ?? undefined;

    const conversation = await getConversationForParticipant(id, auth.userId);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation introuvable" },
        { status: 404 }
      );
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
  } catch (error) {
    console.error("[GET /api/conversations/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
