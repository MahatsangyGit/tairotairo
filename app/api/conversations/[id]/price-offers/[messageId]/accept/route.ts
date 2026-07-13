import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import {
  conversationPath,
  getConversationForParticipant,
  getCounterpartyFromConversation,
} from "@/lib/conversations";
import { acceptPriceOffer } from "@/lib/price-negotiation";
import { serializeMessage } from "@/lib/message-serialize";
import { notifyMessageReceived } from "@/lib/notify-messages";
import { publishThreadRefresh } from "@/lib/realtime/publish";

// POST — Accepter une proposition de prix
export const POST = withApiHandler(
  "POST /api/conversations/[id]/price-offers/[messageId]/accept",
  async (req, { params }) => {
    const auth = await requireAuthOrThrow(req);
    const { id, messageId } = await params;

    const conversation = await getConversationForParticipant(id, auth.userId);
    if (!conversation) {
      throwNotFound("Conversation introuvable");
    }

    const result = await acceptPriceOffer({
      conversationId: id,
      messageId,
      accepterId: auth.userId,
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const accepter = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { name: true },
    });

    const recipient = getCounterpartyFromConversation(conversation, auth.userId);
    const recipientRole =
      recipient.id === conversation.clientId ? "CLIENT" : "PROVIDER";

    notifyMessageReceived({
      recipientId: recipient.id,
      senderName: accepter?.name ?? "Un utilisateur",
      preview: result.confirmation.body,
      conversationLink: conversationPath(recipientRole, id),
    }).catch(console.error);

    publishThreadRefresh(
      {
        clientId: conversation.clientId,
        providerId: conversation.providerId,
      },
      id
    );

    return NextResponse.json({
      message: serializeMessage(result.confirmation, auth.userId),
      offerMessageId: messageId,
      bookingId: result.bookingId,
      price: result.price,
      negotiation: result.negotiation,
    });
  }
);
