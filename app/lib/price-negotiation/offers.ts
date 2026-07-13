import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { MessageKind, PriceOfferStatus } from "@/generated/prisma/enums";
import {
  formatPriceOfferBody,
} from "@/lib/message-serialize";
import {
  acceptRequestPriceOffer,
  acceptServicePriceOffer,
} from "@/lib/price-negotiation/booking";
import {
  loadOfferForAccept,
  resolveNegotiationForConversation,
  supersedePendingOffers,
} from "@/lib/price-negotiation/context";

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

  const negotiation = await resolveNegotiationForConversation(
    conversationId,
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

    const refreshed = await resolveNegotiationForConversation(
      conversationId,
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

    const negotiation = await resolveNegotiationForConversation(
      conversationId,
      conversation.clientId,
      conversation.providerId,
      offer.serviceId
        ? { serviceId: offer.serviceId }
        : { requestResponseId: offer.requestResponseId ?? undefined }
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
