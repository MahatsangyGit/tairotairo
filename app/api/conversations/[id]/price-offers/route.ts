import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  conversationPathWithNegotiation,
  getConversationForParticipant,
  getCounterpartyFromConversation,
} from "@/lib/conversations";
import { createPriceOffer } from "@/lib/price-negotiation";
import { serializeMessage } from "@/lib/message-serialize";
import { notifyMessageReceived } from "@/lib/notify-messages";

// POST — Proposer un prix dans la conversation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const { price, requestResponseId, serviceId } = await req.json();

    const parsed = parseFloat(price);
    if (Number.isNaN(parsed) || parsed < 0) {
      return NextResponse.json({ error: "Prix invalide" }, { status: 400 });
    }

    if (!requestResponseId && !serviceId) {
      return NextResponse.json(
        { error: "requestResponseId ou serviceId requis" },
        { status: 400 }
      );
    }

    const conversation = await getConversationForParticipant(id, auth.userId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation introuvable" },
        { status: 404 }
      );
    }

    const result = await createPriceOffer({
      conversationId: id,
      senderId: auth.userId,
      price: parsed,
      ...(requestResponseId
        ? { requestResponseId: String(requestResponseId) }
        : { serviceId: String(serviceId) }),
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

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("[POST /api/conversations/[id]/price-offers]", error);
    const detail =
      error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Erreur serveur"
            : detail,
      },
      { status: 500 }
    );
  }
}
