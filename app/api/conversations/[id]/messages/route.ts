import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  conversationPath,
  getConversationForParticipant,
  getCounterpartyFromConversation,
} from "@/lib/conversations";
import { notifyMessageReceived } from "@/lib/notify-messages";
import { serializeMessage } from "@/lib/message-serialize";

const MAX_BODY_LENGTH = 2000;

// POST — Envoyer un message
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
    const { body } = await req.json();
    const text = body ? String(body).trim() : "";

    if (!text) {
      return NextResponse.json(
        { error: "Le message ne peut pas être vide" },
        { status: 400 }
      );
    }

    if (text.length > MAX_BODY_LENGTH) {
      return NextResponse.json(
        { error: `Message trop long (max ${MAX_BODY_LENGTH} caractères)` },
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

    const sender = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { name: true },
    });

    if (!sender) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
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

    return NextResponse.json({
      message: serializeMessage(message, auth.userId),
    });
  } catch (error) {
    console.error("[POST /api/conversations/[id]/messages]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
