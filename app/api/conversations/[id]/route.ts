import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  getConversationContext,
  getConversationForParticipant,
  getCounterpartyFromConversation,
} from "@/lib/conversations";

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

    const conversation = await getConversationForParticipant(id, auth.userId);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation introuvable" },
        { status: 404 }
      );
    }

    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: auth.userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

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

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        bookingId: context.bookingId,
        subject: context.subject,
        isDirect: context.isDirect,
        bookingStatus: context.bookingStatus,
        counterparty: {
          id: counterparty.id,
          name: counterparty.name,
          avatar: counterparty.avatar,
        },
      },
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt,
        isMine: m.senderId === auth.userId,
        sender: {
          id: m.sender.id,
          name: m.sender.name,
          avatar: m.sender.avatar,
        },
      })),
    });
  } catch (error) {
    console.error("[GET /api/conversations/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
