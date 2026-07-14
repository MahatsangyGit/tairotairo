import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import {
  conversationInclude,
  getConversationContextsBatch,
  getCounterpartyFromConversation,
  messagesBasePath,
} from "@/lib/conversations";
import { getNegotiationHintsForConversations } from "@/lib/price-negotiation";
import {
  decodeTimeIdCursor,
  encodeTimeIdCursor,
  parsePageLimit,
} from "@/lib/keyset-cursor";
import type { Prisma } from "@/generated/prisma/client";

// GET — Liste paginée des conversations de l'utilisateur connecté
export const GET = withApiHandler("GET /api/conversations", async (req) => {
  const auth = await requireAuthOrThrow(req);

  const role = auth.role === "PROVIDER" ? "PROVIDER" : "CLIENT";
  const basePath = messagesBasePath(role);
  const limit = parsePageLimit(req.nextUrl.searchParams.get("limit"), {
    default: 50,
    max: 100,
  });
  const cursor = decodeTimeIdCursor(req.nextUrl.searchParams.get("cursor"));

  const participantWhere: Prisma.ConversationWhereInput = {
    OR: [{ clientId: auth.userId }, { providerId: auth.userId }],
  };

  const where: Prisma.ConversationWhereInput = cursor
    ? {
        AND: [
          participantWhere,
          {
            OR: [
              { updatedAt: { lt: cursor.at } },
              { updatedAt: cursor.at, id: { lt: cursor.id } },
            ],
          },
        ],
      }
    : participantWhere;

  const [rows, unreadTotal] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
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
    }),
    prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: auth.userId },
        conversation: participantWhere,
      },
    }),
  ]);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const conversationIds = page.map((c) => c.id);

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

  const [contexts, hintsMap] = await Promise.all([
    getConversationContextsBatch(
      page.map((c) => ({ clientId: c.clientId, providerId: c.providerId }))
    ),
    getNegotiationHintsForConversations(conversationIds),
  ]);

  const conversations = page.map((c) => {
    const last = c.messages[0] ?? null;
    const counterparty = getCounterpartyFromConversation(c, auth.userId);
    const context =
      contexts.get(`${c.clientId}:${c.providerId}`) ?? {
        subject: "Discussion directe",
        bookingId: null,
        bookingStatus: null,
        isDirect: true,
      };
    const hints = hintsMap.get(c.id);

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
  });

  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeTimeIdCursor(last.updatedAt, last.id)
      : null;

  return NextResponse.json({
    conversations,
    unreadTotal,
    nextCursor,
    hasMore,
  });
});
