import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow, requireEmailVerified } from "@/lib/auth";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import {
  conversationPath,
  getConversationForParticipant,
  getCounterpartyFromConversation,
} from "@/lib/conversations";
import { notifyMessageReceived } from "@/lib/notify-messages";
import { serializeMessage } from "@/lib/message-serialize";
import { publishMessageCreated } from "@/lib/realtime/publish";
import {
  messageBodySchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";
import { API_RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";

// POST — Envoyer un message
export const POST = withApiHandler(
  "POST /api/conversations/[id]/messages",
  async (req, { params }) => {
    const auth = await requireAuthOrThrow(req);

    const rateLimited = await enforceRateLimit(
      req,
      "message",
      API_RATE_LIMITS.message,
      { userId: auth.userId }
    );
    if (rateLimited) return rateLimited;

    await requireEmailVerified(auth);

    const { id } = await params;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(messageBodySchema, json.body);
    if (!parsed.ok) return parsed.response;

    const text = parsed.data.body;

    const conversation = await getConversationForParticipant(id, auth.userId);

    if (!conversation) {
      throwNotFound("Conversation introuvable");
    }

    const sender = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { name: true },
    });

    if (!sender) {
      throwNotFound("Utilisateur introuvable");
    }

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId: id,
          senderId: auth.userId,
          body: text,
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
        },
      });

      await tx.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return created;
    });

    const recipient = getCounterpartyFromConversation(conversation, auth.userId);
    const recipientRole =
      recipient.id === conversation.clientId ? "CLIENT" : "PROVIDER";

    notifyMessageReceived({
      recipientId: recipient.id,
      senderName: sender.name,
      preview: text,
      conversationLink: conversationPath(recipientRole, id),
    }).catch(console.error);

    publishMessageCreated(
      {
        clientId: conversation.clientId,
        providerId: conversation.providerId,
      },
      id,
      message
    );

    return NextResponse.json({
      message: serializeMessage(message, auth.userId),
    });
  }
);
