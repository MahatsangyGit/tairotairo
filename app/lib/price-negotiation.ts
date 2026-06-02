import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { MessageKind, PriceOfferStatus } from "@/generated/prisma/enums";
import {
  resolveBookingDate,
  snapshotFromRequest,
  snapshotFromService,
} from "@/lib/booking-display";
import {
  formatPriceAcceptedBody,
  formatPriceOfferBody,
} from "@/lib/message-serialize";
import {
  notifyBookingConfirmed,
  notifyBookingCreated,
} from "@/lib/notify-booking";
import { notifyRequestResponseAccepted } from "@/lib/notify-requests";
import type {
  NegotiationContext,
  RequestNegotiationContext,
  ServiceNegotiationContext,
} from "@/lib/price-negotiation-types";

export type { NegotiationContext };

const NEGOTIABLE_REQUEST_STATUSES = ["PENDING", "ACCEPTED"] as const;

function defaultServiceBookingDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(9, 0, 0, 0);
  return d;
}

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

  let booking = await prisma.booking.findFirst({
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
              desiredDate: true,
            },
          },
          booking: { select: { id: true, status: true } },
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
              desiredDate: true,
            },
          },
          booking: { select: { id: true, status: true } },
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
    responseStatus: response.status,
    currentPrice: response.proposedPrice,
    referencePrice: response.request.budget,
    bookingId: response.booking?.id ?? null,
    bookingStatus: response.booking?.status ?? null,
    canNegotiate: !bookingCancelled,
  };
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

async function supersedePendingOffers(
  conversationId: string,
  scope: { requestResponseId?: string; serviceId?: string },
  exceptMessageId?: string
) {
  if (!scope.requestResponseId && !scope.serviceId) return;

  await prisma.message.updateMany({
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

function prismaUserMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      return "Contexte de négociation invalide ou expiré";
    }
    if (error.code === "P2025") {
      return "Enregistrement introuvable";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Erreur serveur";
}

export async function createPriceOffer(params: {
  conversationId: string;
  senderId: string;
  price: number;
  requestResponseId?: string;
  serviceId?: string;
}) {
  const { conversationId, senderId, price, requestResponseId, serviceId } =
    params;

  if (price < 0 || !Number.isFinite(price)) {
    return { error: "Prix invalide", status: 400 as const };
  }

  if (!requestResponseId && !serviceId) {
    return {
      error: "requestResponseId ou serviceId requis",
      status: 400 as const,
    };
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { clientId: true, providerId: true },
  });

  if (!conversation) {
    return { error: "Conversation introuvable", status: 404 as const };
  }

  if (
    senderId !== conversation.clientId &&
    senderId !== conversation.providerId
  ) {
    return { error: "Accès refusé", status: 403 as const };
  }

  const negotiation = await findNegotiationForPair(
    conversation.clientId,
    conversation.providerId,
    { requestResponseId, serviceId }
  );

  if (!negotiation?.canNegotiate) {
    return {
      error: "Aucun contexte actif pour négocier le prix",
      status: 400 as const,
    };
  }

  const scope =
    negotiation.source === "service"
      ? { serviceId: negotiation.serviceId }
      : { requestResponseId: negotiation.requestResponseId };

  if (!scope.serviceId && !scope.requestResponseId) {
    return {
      error: "Contexte de marchandage incomplet",
      status: 400 as const,
    };
  }

  try {
    const message = await prisma.$transaction(async (tx) => {
      await supersedePendingOffers(conversationId, scope);

      const created = await tx.message.create({
        data: {
          conversationId,
          senderId,
          kind: MessageKind.PRICE_OFFER,
          offerPrice: price,
          offerStatus: PriceOfferStatus.PENDING,
          body: formatPriceOfferBody(price),
          ...(negotiation.source === "service"
            ? { serviceId: negotiation.serviceId }
            : { requestResponseId: negotiation.requestResponseId }),
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return created;
    });

    const refreshed = await findNegotiationForPair(
      conversation.clientId,
      conversation.providerId,
      {
        requestResponseId:
          negotiation.source === "request"
            ? negotiation.requestResponseId
            : undefined,
        serviceId:
          negotiation.source === "service" ? negotiation.serviceId : undefined,
      }
    );

    return { message, negotiation: refreshed ?? negotiation };
  } catch (error) {
    console.error("[createPriceOffer]", error);
    const clientError =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2003" || error.code === "P2025");
    return {
      error: prismaUserMessage(error),
      status: clientError ? (400 as const) : (500 as const),
    };
  }
}

async function acceptRequestPriceOffer(
  offer: NonNullable<Awaited<ReturnType<typeof loadOfferForAccept>>> & {
    requestResponse: NonNullable<
      NonNullable<Awaited<ReturnType<typeof loadOfferForAccept>>>["requestResponse"]
    >;
  },
  conversationId: string,
  messageId: string,
  accepterId: string
) {
  const response = offer.requestResponse;
  const request = response.request;
  const requestId = request.id;
  const price = offer.offerPrice!;

  const result = await prisma.$transaction(async (tx) => {
    await tx.message.update({
      where: { id: messageId },
      data: { offerStatus: PriceOfferStatus.ACCEPTED },
    });

    await supersedePendingOffers(
      conversationId,
      { requestResponseId: offer.requestResponseId! },
      messageId
    );

    await tx.requestResponse.update({
      where: { id: response.id },
      data: { proposedPrice: price },
    });

    let booking = response.booking;

    if (!booking && response.status === "PENDING") {
      await tx.requestResponse.updateMany({
        where: {
          requestId,
          id: { not: response.id },
          status: "PENDING",
        },
        data: { status: "REJECTED" },
      });

      await tx.requestResponse.update({
        where: { id: response.id },
        data: { status: "ACCEPTED" },
      });

      await tx.serviceRequest.update({
        where: { id: requestId },
        data: { open: false },
      });

      const snapshot = snapshotFromRequest(
        {
          id: request.id,
          title: request.title,
          budget: request.budget,
          category: request.category,
          location: request.location,
        },
        price
      );

      booking = await tx.booking.create({
        data: {
          clientId: request.clientId,
          providerId: response.providerId,
          requestResponseId: response.id,
          date: resolveBookingDate(request.desiredDate),
          status: "CONFIRMED",
          ...snapshot,
        },
      });
    } else if (booking) {
      const snapshot = snapshotFromRequest(
        {
          id: request.id,
          title: request.title,
          budget: request.budget,
          category: request.category,
          location: request.location,
        },
        price
      );

      booking = await tx.booking.update({
        where: { id: booking.id },
        data: snapshot,
      });
    } else if (response.status === "ACCEPTED") {
      const snapshot = snapshotFromRequest(
        {
          id: request.id,
          title: request.title,
          budget: request.budget,
          category: request.category,
          location: request.location,
        },
        price
      );

      booking = await tx.booking.create({
        data: {
          clientId: request.clientId,
          providerId: response.providerId,
          requestResponseId: response.id,
          date: resolveBookingDate(request.desiredDate),
          status: "CONFIRMED",
          ...snapshot,
        },
      });
    }

    const confirmation = await tx.message.create({
      data: {
        conversationId,
        senderId: accepterId,
        kind: "TEXT",
        body: formatPriceAcceptedBody(price),
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return { booking, confirmation, price, wasNewRequestBooking: !response.booking && response.status === "PENDING" };
  });

  if (result.booking && result.wasNewRequestBooking) {
    notifyBookingConfirmed(result.booking.id).catch(console.error);
    notifyRequestResponseAccepted(
      requestId,
      response.providerId,
      request.title
    ).catch(console.error);
  }

  return result;
}

async function acceptServicePriceOffer(
  offer: {
    id: string;
    offerPrice: number | null;
    serviceId: string | null;
    conversation: { clientId: string; providerId: string };
  },
  conversationId: string,
  messageId: string,
  accepterId: string
) {
  const price = offer.offerPrice!;
  const service = await prisma.service.findUnique({
    where: { id: offer.serviceId! },
    select: {
      id: true,
      title: true,
      price: true,
      category: true,
      location: true,
      providerId: true,
    },
  });

  if (!service || service.providerId !== offer.conversation.providerId) {
    throw new Error("Service introuvable");
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.message.update({
      where: { id: messageId },
      data: { offerStatus: PriceOfferStatus.ACCEPTED },
    });

    await supersedePendingOffers(
      conversationId,
      { serviceId: service.id },
      messageId
    );

    const snapshot = snapshotFromService(service, price);

    let booking = await tx.booking.findFirst({
      where: {
        clientId: offer.conversation.clientId,
        providerId: offer.conversation.providerId,
        serviceId: service.id,
        status: { notIn: ["CANCELLED"] },
      },
      orderBy: { updatedAt: "desc" },
    });

    const wasNew = !booking;

    if (booking) {
      booking = await tx.booking.update({
        where: { id: booking.id },
        data: snapshot,
      });
    } else {
      booking = await tx.booking.create({
        data: {
          clientId: offer.conversation.clientId,
          providerId: offer.conversation.providerId,
          serviceId: service.id,
          date: defaultServiceBookingDate(),
          status: "PENDING",
          ...snapshot,
        },
      });
    }

    const confirmation = await tx.message.create({
      data: {
        conversationId,
        senderId: accepterId,
        kind: "TEXT",
        body: formatPriceAcceptedBody(price),
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return { booking, confirmation, price, wasNew };
  });

  if (result.wasNew) {
    notifyBookingCreated(result.booking.id).catch(console.error);
  }

  return result;
}

async function loadOfferForAccept(messageId: string, conversationId: string) {
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
            },
          },
          booking: true,
        },
      },
    },
  });
}

export async function acceptPriceOffer(params: {
  conversationId: string;
  messageId: string;
  accepterId: string;
}) {
  const { conversationId, messageId, accepterId } = params;

  const offer = await loadOfferForAccept(messageId, conversationId);

  if (!offer) {
    return { error: "Proposition de prix introuvable", status: 404 as const };
  }

  if (offer.senderId === accepterId) {
    return {
      error: "Vous ne pouvez pas accepter votre propre prix",
      status: 400 as const,
    };
  }

  const { conversation } = offer;
  if (
    accepterId !== conversation.clientId &&
    accepterId !== conversation.providerId
  ) {
    return { error: "Accès refusé", status: 403 as const };
  }

  if (offer.offerPrice === null || offer.offerPrice < 0) {
    return { error: "Prix invalide", status: 400 as const };
  }

  try {
    const result = offer.serviceId
      ? await acceptServicePriceOffer(offer, conversationId, messageId, accepterId)
      : offer.requestResponseId && offer.requestResponse
        ? await acceptRequestPriceOffer(
            { ...offer, requestResponse: offer.requestResponse },
            conversationId,
            messageId,
            accepterId
          )
        : null;

    if (!result) {
      return { error: "Proposition de prix introuvable", status: 404 as const };
    }

    const negotiation = await findNegotiationForPair(
      conversation.clientId,
      conversation.providerId,
      offer.serviceId
        ? { serviceId: offer.serviceId }
        : { requestResponseId: offer.requestResponseId }
    );

    return {
      bookingId: result.booking?.id ?? null,
      price: result.price,
      confirmation: result.confirmation,
      negotiation,
    };
  } catch (e) {
    console.error("[acceptPriceOffer]", e);
    return { error: "Erreur serveur", status: 500 as const };
  }
}
