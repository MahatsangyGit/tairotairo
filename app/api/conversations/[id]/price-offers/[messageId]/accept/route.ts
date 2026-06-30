import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
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
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id, messageId } = await params;

    const conversation = await getConversationForParticipant(id, auth.userId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation introuvable" },
        { status: 404 }
      );
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
  } catch (error) {
    console.error(
      "[POST /api/conversations/[id]/price-offers/[messageId]/accept]",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
