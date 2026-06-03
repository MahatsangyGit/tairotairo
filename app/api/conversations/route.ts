import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  conversationInclude,
  getConversationContext,
  getCounterpartyFromConversation,
  messagesBasePath,
} from "@/lib/conversations";
import { getNegotiationHintsFromMessages } from "@/lib/price-negotiation";

// GET — Liste des conversations de l'utilisateur connecté
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const role = auth.role === "PROVIDER" ? "PROVIDER" : "CLIENT";
    const basePath = messagesBasePath(role);

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ clientId: auth.userId }, { providerId: auth.userId }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        ...conversationInclude,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: { select: { id: true, name: true } },
          },
        },
      },
    });

    const conversationIds = conversations.map((c) => c.id);

    const unreadByConversation =
      conversationIds.length === 0
        ? []
        : await prisma.message.groupBy({
            by: ["conversationId"],
            where: {
              conversationId: { in: conversationIds },
              senderId: { not: auth.userId },
              readAt: null,
            },
            _count: { id: true },
          });

    const unreadMap = new Map(
      unreadByConversation.map((u) => [u.conversationId, u._count.id])
    );

    const items = await Promise.all(
      conversations.map(async (c) => {
        const last = c.messages[0] ?? null;
        const counterparty = getCounterpartyFromConversation(c, auth.userId);
        const context = await getConversationContext(c.clientId, c.providerId);
        const hints = await getNegotiationHintsFromMessages(c.id);

        let href = `${basePath}/${c.id}`;
        if (hints?.serviceId) {
          href += `?service=${encodeURIComponent(hints.serviceId)}`;
        } else if (hints?.requestResponseId) {
          href += `?response=${encodeURIComponent(hints.requestResponseId)}`;
        }

        return {
          id: c.id,
          bookingId: context.bookingId,
          subject: context.subject,
          isDirect: context.isDirect,
          bookingStatus: context.bookingStatus,
          counterparty: {
            id: counterparty.id,
            name: counterparty.name,
            avatar: counterparty.avatar,
          },
          lastMessage: last
            ? {
                body: last.body,
                createdAt: last.createdAt,
                isMine: last.senderId === auth.userId,
                senderName: last.sender.name,
              }
            : null,
          unreadCount: unreadMap.get(c.id) ?? 0,
          href,
        };
      })
    );

    const unreadTotal = items.reduce((sum, i) => sum + i.unreadCount, 0);

    return NextResponse.json({ conversations: items, unreadTotal });
  } catch (error) {
    console.error("[GET /api/conversations]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
