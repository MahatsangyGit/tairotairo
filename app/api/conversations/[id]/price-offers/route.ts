import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import {
  conversationPathWithNegotiation,
  getConversationForParticipant,
  getCounterpartyFromConversation,
} from "@/lib/conversations";
import { createPriceOffer } from "@/lib/price-negotiation";
import { serializeMessage } from "@/lib/message-serialize";
import { notifyMessageReceived } from "@/lib/notify-messages";
import { publishThreadRefresh } from "@/lib/realtime/publish";
import {
  parseBody,
  parseJsonBody,
  priceOfferSchema,
} from "@/lib/api-schemas";

// POST — Proposer un prix dans la conversation
export const POST = withApiHandler(
  "POST /api/conversations/[id]/price-offers",
  async (req, { params }) => {
    const auth = await requireAuthOrThrow(req);
    const { id } = await params;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(priceOfferSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { price, requestResponseId, serviceId } = parsed.data;

    const conversation = await getConversationForParticipant(id, auth.userId);
    if (!conversation) {
      throwNotFound("Conversation introuvable");
    }

    const result = await createPriceOffer({
      conversationId: id,
      senderId: auth.userId,
      price,
      ...(requestResponseId
        ? { requestResponseId }
        : { serviceId: serviceId! }),
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const sender = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { name: true },
    });

    const recipient = getCounterpartyFromConversation(conversation, auth.userId);
    const recipientRole =
      recipient.id === conversation.clientId ? "CLIENT" : "PROVIDER";

    const responseBody = {
      message: serializeMessage(result.message, auth.userId),
      negotiation: result.negotiation,
    };

    notifyMessageReceived({
      recipientId: recipient.id,
      senderName: sender?.name ?? "Un utilisateur",
      preview: result.message.body,
      conversationLink: conversationPathWithNegotiation(
        recipientRole,
        id,
        result.negotiation
      ),
    }).catch(console.error);

    publishThreadRefresh(
      {
        clientId: conversation.clientId,
        providerId: conversation.providerId,
      },
      id
    );

    return NextResponse.json(responseBody);
  }
);
