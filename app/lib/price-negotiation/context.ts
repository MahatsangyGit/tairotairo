import prisma from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { MessageKind, PriceOfferStatus } from "@/generated/prisma/enums";
import type {
  NegotiationContext,
  RequestNegotiationContext,
  ServiceNegotiationContext,
} from "@/lib/price-negotiation-types";

const NEGOTIABLE_REQUEST_STATUSES = ["PENDING", "ACCEPTED"] as const;

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function findServiceNegotiation(
  clientId: string,
  providerId: string,
  serviceId?: string | null
): Promise<ServiceNegotiationContext | null> {
  let service = serviceId
    ? await prisma.service.findFirst({
        where: { id: serviceId, providerId },
        select: {
          id: true,
          title: true,
          price: true,
          category: true,
          location: true,
          available: true,
        },
      })
    : null;

  const booking = await prisma.booking.findFirst({
    where: {
      clientId,
      providerId,
      serviceId: service ? service.id : { not: null },
      status: { notIn: ["CANCELLED"] },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      status: true,
      displayPrice: true,
      serviceId: true,
      commissionRate: true,
    },
  });

  if (!service && booking?.serviceId) {
    service = await prisma.service.findFirst({
      where: { id: booking.serviceId, providerId },
      select: {
        id: true,
        title: true,
        price: true,
        category: true,
        location: true,
        available: true,
      },
    });
  }

  if (!service) return null;

  const bookingCancelled = booking?.status === "CANCELLED";
  const bookingCompleted = booking?.status === "COMPLETED";
  const currentPrice = booking?.displayPrice ?? service.price;

  return {
    source: "service",
    serviceId: service.id,
    serviceTitle: service.title,
    category: service.category,
    commissionRate: booking?.commissionRate ?? null,
    listPrice: service.price,
    currentPrice,
    bookingId: booking?.id ?? null,
    bookingStatus: booking?.status ?? null,
    canNegotiate: service.available && !bookingCancelled && !bookingCompleted,
  };
}

async function findRequestNegotiation(
  clientId: string,
  providerId: string,
  requestResponseId?: string | null
): Promise<RequestNegotiationContext | null> {
  const response = requestResponseId
    ? await prisma.requestResponse.findFirst({
        where: {
          id: requestResponseId,
          providerId,
          request: { clientId },
        },
        include: {
          request: {
            select: {
              id: true,
              title: true,
              budget: true,
              category: true,
              desiredDate: true,
              desiredSlotStart: true,
              desiredSlotEnd: true,
            },
          },
          booking: { select: { id: true, status: true, commissionRate: true } },
        },
      })
    : await prisma.requestResponse.findFirst({
        where: {
          providerId,
          request: { clientId },
          status: { in: [...NEGOTIABLE_REQUEST_STATUSES] },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          request: {
            select: {
              id: true,
              title: true,
              budget: true,
              category: true,
              desiredDate: true,
              desiredSlotStart: true,
              desiredSlotEnd: true,
            },
          },
          booking: { select: { id: true, status: true, commissionRate: true } },
        },
      });

  if (!response) return null;
  if (
    !NEGOTIABLE_REQUEST_STATUSES.includes(
      response.status as (typeof NEGOTIABLE_REQUEST_STATUSES)[number]
    )
  ) {
    return null;
  }

  const bookingCancelled = response.booking?.status === "CANCELLED";

  return {
    source: "request",
    requestResponseId: response.id,
    requestId: response.request.id,
    requestTitle: response.request.title,
    category: response.request.category,
    commissionRate: response.booking?.commissionRate ?? null,
    responseStatus: response.status,
    currentPrice: response.proposedPrice,
    referencePrice: response.request.budget,
    bookingId: response.booking?.id ?? null,
    bookingStatus: response.booking?.status ?? null,
    canNegotiate: !bookingCancelled,
  };
}

export type NegotiationHints = {
  serviceId?: string;
  requestResponseId?: string;
};

function hintsFromOffer(offer: {
  serviceId: string | null;
  requestResponseId: string | null;
}): NegotiationHints {
  return {
    ...(offer.serviceId ? { serviceId: offer.serviceId } : {}),
    ...(offer.requestResponseId
      ? { requestResponseId: offer.requestResponseId }
      : {}),
  };
}

/** Déduit le contexte actif à partir des offres de prix dans le fil. */
export async function getNegotiationHintsFromMessages(
  conversationId: string
): Promise<NegotiationHints | null> {
  const map = await getNegotiationHintsForConversations([conversationId]);
  return map.get(conversationId) ?? null;
}

/** Batch version of getNegotiationHintsFromMessages — few queries for many threads. */
export async function getNegotiationHintsForConversations(
  conversationIds: string[]
): Promise<Map<string, NegotiationHints | null>> {
  const result = new Map<string, NegotiationHints | null>();
  if (conversationIds.length === 0) return result;

  for (const id of conversationIds) {
    result.set(id, null);
  }

  const pending = await prisma.message.findMany({
    where: {
      conversationId: { in: conversationIds },
      kind: MessageKind.PRICE_OFFER,
      offerStatus: PriceOfferStatus.PENDING,
    },
    orderBy: { createdAt: "desc" },
    select: {
      conversationId: true,
      serviceId: true,
      requestResponseId: true,
    },
  });

  const withPending = new Set<string>();
  for (const row of pending) {
    if (withPending.has(row.conversationId)) continue;
    withPending.add(row.conversationId);
    result.set(row.conversationId, hintsFromOffer(row));
  }

  const remaining = conversationIds.filter((id) => !withPending.has(id));
  if (remaining.length === 0) return result;

  const accepted = await prisma.message.findMany({
    where: {
      conversationId: { in: remaining },
      kind: MessageKind.PRICE_OFFER,
      offerStatus: PriceOfferStatus.ACCEPTED,
    },
    select: { conversationId: true },
    distinct: ["conversationId"],
  });
  const acceptedSet = new Set(accepted.map((a) => a.conversationId));

  const needLast = remaining.filter((id) => !acceptedSet.has(id));
  if (needLast.length === 0) return result;

  const lastOffers = await prisma.message.findMany({
    where: {
      conversationId: { in: needLast },
      kind: MessageKind.PRICE_OFFER,
      OR: [{ serviceId: { not: null } }, { requestResponseId: { not: null } }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      conversationId: true,
      serviceId: true,
      requestResponseId: true,
    },
  });

  const seenLast = new Set<string>();
  for (const row of lastOffers) {
    if (seenLast.has(row.conversationId)) continue;
    seenLast.add(row.conversationId);
    result.set(row.conversationId, hintsFromOffer(row));
  }

  return result;
}

async function applyNegotiationOpenState(
  ctx: NegotiationContext,
  conversationId: string
): Promise<NegotiationContext> {
  const scopeFilter =
    ctx.source === "service"
      ? { serviceId: ctx.serviceId }
      : { requestResponseId: ctx.requestResponseId };

  const accepted = await prisma.message.findFirst({
    where: {
      conversationId,
      kind: MessageKind.PRICE_OFFER,
      offerStatus: PriceOfferStatus.ACCEPTED,
      ...scopeFilter,
    },
    select: { id: true },
  });

  if (accepted) {
    return { ...ctx, canNegotiate: false };
  }

  return ctx;
}

/** Résout le marchandage (URL, messages du fil, puis réservation / proposition). */
export async function resolveNegotiationForConversation(
  conversationId: string,
  clientId: string,
  providerId: string,
  options?: { requestResponseId?: string | null; serviceId?: string | null }
): Promise<NegotiationContext | null> {
  let ctx: NegotiationContext | null = null;

  if (options?.serviceId) {
    ctx = await findServiceNegotiation(
      clientId,
      providerId,
      options.serviceId
    );
  } else if (options?.requestResponseId) {
    ctx = await findRequestNegotiation(
      clientId,
      providerId,
      options.requestResponseId
    );
  } else {
    const hints = await getNegotiationHintsFromMessages(conversationId);

    if (hints?.serviceId) {
      ctx = await findServiceNegotiation(
        clientId,
        providerId,
        hints.serviceId
      );
    } else if (hints?.requestResponseId) {
      ctx = await findRequestNegotiation(
        clientId,
        providerId,
        hints.requestResponseId
      );
    }

    if (!ctx) {
      const serviceCtx = await findServiceNegotiation(clientId, providerId);
      if (serviceCtx?.canNegotiate) ctx = serviceCtx;
      else ctx = await findRequestNegotiation(clientId, providerId);
    }
  }

  if (!ctx) return null;
  return applyNegotiationOpenState(ctx, conversationId);
}

export async function findNegotiationForPair(
  clientId: string,
  providerId: string,
  options?: { requestResponseId?: string | null; serviceId?: string | null }
): Promise<NegotiationContext | null> {
  if (options?.serviceId) {
    return findServiceNegotiation(clientId, providerId, options.serviceId);
  }
  if (options?.requestResponseId) {
    return findRequestNegotiation(
      clientId,
      providerId,
      options.requestResponseId
    );
  }

  const serviceCtx = await findServiceNegotiation(clientId, providerId);
  if (serviceCtx?.canNegotiate) return serviceCtx;

  return findRequestNegotiation(clientId, providerId);
}

export async function loadOfferForAccept(
  messageId: string,
  conversationId: string
) {
  return prisma.message.findFirst({
    where: {
      id: messageId,
      conversationId,
      kind: MessageKind.PRICE_OFFER,
      offerStatus: PriceOfferStatus.PENDING,
    },
    include: {
      conversation: { select: { clientId: true, providerId: true } },
      requestResponse: {
        include: {
          request: {
            select: {
              id: true,
              clientId: true,
              title: true,
              budget: true,
              category: true,
              location: true,
              desiredDate: true,
              desiredSlotStart: true,
              desiredSlotEnd: true,
            },
          },
          booking: true,
        },
      },
    },
  });
}

export async function supersedePendingOffers(
  conversationId: string,
  scope: { requestResponseId?: string; serviceId?: string },
  exceptMessageId?: string,
  db: DbClient = prisma
) {
  if (!scope.requestResponseId && !scope.serviceId) return;

  await db.message.updateMany({
    where: {
      conversationId,
      kind: MessageKind.PRICE_OFFER,
      offerStatus: PriceOfferStatus.PENDING,
      ...(scope.requestResponseId
        ? { requestResponseId: scope.requestResponseId }
        : {}),
      ...(scope.serviceId ? { serviceId: scope.serviceId } : {}),
      ...(exceptMessageId ? { id: { not: exceptMessageId } } : {}),
    },
    data: { offerStatus: PriceOfferStatus.SUPERSEDED },
  });
}
