import prisma from "@/lib/prisma";
import { getBookingDisplayInfo } from "@/lib/booking-display";

export type DashboardRole = "CLIENT" | "PROVIDER";

const bookingContextInclude = {
  service: {
    select: {
      id: true,
      title: true,
      price: true,
      category: true,
      location: true,
    },
  },
  requestResponse: {
    select: {
      proposedPrice: true,
      request: {
        select: {
          id: true,
          title: true,
          budget: true,
          category: true,
          location: true,
        },
      },
    },
  },
} as const;

export const conversationParticipantSelect = {
  id: true,
  name: true,
  avatar: true,
} as const;

export const conversationInclude = {
  client: { select: conversationParticipantSelect },
  provider: { select: conversationParticipantSelect },
} as const;

export function messagesBasePath(role: DashboardRole): string {
  return role === "CLIENT"
    ? "/dashboard/client/messages"
    : "/dashboard/provider/messages";
}

export function conversationPath(
  role: DashboardRole,
  conversationId: string
): string {
  return `${messagesBasePath(role)}/${conversationId}`;
}

export function conversationPathWithNegotiation(
  role: DashboardRole,
  conversationId: string,
  negotiation?: {
    source: "service" | "request";
    serviceId?: string;
    requestResponseId?: string;
  } | null
): string {
  const base = conversationPath(role, conversationId);
  if (!negotiation) return base;
  if (negotiation.source === "service" && negotiation.serviceId) {
    return `${base}?service=${encodeURIComponent(negotiation.serviceId)}`;
  }
  if (negotiation.source === "request" && negotiation.requestResponseId) {
    return `${base}?response=${encodeURIComponent(negotiation.requestResponseId)}`;
  }
  return base;
}

export function getCounterpartyFromConversation(
  conversation: {
    clientId: string;
    providerId: string;
    client: { id: string; name: string; avatar: string | null };
    provider: { id: string; name: string; avatar: string | null };
  },
  userId: string
) {
  return conversation.clientId === userId
    ? conversation.provider
    : conversation.client;
}

export async function getBookingForParticipant(
  bookingId: string,
  userId: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      ...bookingContextInclude,
      client: { select: conversationParticipantSelect },
      provider: { select: conversationParticipantSelect },
    },
  });

  if (!booking) return null;
  if (booking.clientId !== userId && booking.providerId !== userId) {
    return null;
  }

  return booking;
}

export async function getConversationForParticipant(
  conversationId: string,
  userId: string
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: conversationInclude,
  });

  if (!conversation) return null;
  if (
    conversation.clientId !== userId &&
    conversation.providerId !== userId
  ) {
    return null;
  }

  return conversation;
}

export function bookingSubject(booking: {
  service: {
    id: string;
    title: string;
    price: number;
    category: string;
    location: string;
  } | null;
  requestResponse: {
    proposedPrice: number | null;
    request: {
      id: string;
      title: string;
      budget: number;
      category: string;
      location: string;
    };
  } | null;
}) {
  const display = getBookingDisplayInfo(booking);
  return display?.title ?? "Réservation";
}

export async function getConversationContext(
  clientId: string,
  providerId: string
) {
  const booking = await prisma.booking.findFirst({
    where: {
      clientId,
      providerId,
      status: { not: "CANCELLED" },
    },
    orderBy: { updatedAt: "desc" },
    include: bookingContextInclude,
  });

  if (booking) {
    return {
      subject: bookingSubject(booking),
      bookingId: booking.id,
      bookingStatus: booking.status,
      isDirect: false,
    };
  }

  return {
    subject: "Discussion directe",
    bookingId: null as string | null,
    bookingStatus: null as string | null,
    isDirect: true,
  };
}

type PairResult =
  | { clientId: string; providerId: string }
  | { error: string; status: number };

export async function resolveConversationPair(params: {
  userId: string;
  role: string;
  bookingId?: string;
  providerId?: string;
  clientId?: string;
  requestResponseId?: string;
  serviceId?: string;
}): Promise<PairResult> {
  const {
    userId,
    role,
    bookingId,
    providerId,
    clientId,
    requestResponseId,
    serviceId,
  } = params;
  const provided = [
    bookingId,
    providerId,
    clientId,
    requestResponseId,
    serviceId,
  ].filter(Boolean).length;

  if (provided !== 1) {
    return {
      error:
        "Indiquez exactement un identifiant (bookingId, providerId, clientId, requestResponseId ou serviceId)",
      status: 400,
    };
  }

  if (serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, providerId: true, available: true },
    });

    if (!service) {
      return { error: "Service introuvable", status: 404 };
    }

    if (!service.available) {
      return { error: "Ce service n'est plus disponible", status: 400 };
    }

    if (role !== "CLIENT" && role !== "ADMIN") {
      return {
        error: "Seuls les clients peuvent marchander sur une annonce",
        status: 403,
      };
    }

    if (service.providerId === userId) {
      return { error: "Impossible de marchander sur votre propre annonce", status: 400 };
    }

    return { clientId: userId, providerId: service.providerId };
  }

  if (requestResponseId) {
    const response = await prisma.requestResponse.findUnique({
      where: { id: requestResponseId },
      include: { request: { select: { clientId: true } } },
    });

    if (!response) {
      return { error: "Proposition introuvable", status: 404 };
    }

    const isClient = response.request.clientId === userId;
    const isProvider = response.providerId === userId;

    if (!isClient && !isProvider && role !== "ADMIN") {
      return { error: "Accès refusé", status: 403 };
    }

    return {
      clientId: response.request.clientId,
      providerId: response.providerId,
    };
  }

  if (bookingId) {
    const booking = await getBookingForParticipant(bookingId, userId);
    if (!booking) {
      return { error: "Réservation introuvable", status: 404 };
    }
    return { clientId: booking.clientId, providerId: booking.providerId };
  }

  if (providerId) {
    if (role !== "CLIENT" && role !== "ADMIN") {
      return {
        error: "Seuls les clients peuvent contacter un prestataire ainsi",
        status: 403,
      };
    }
    if (providerId === userId) {
      return { error: "Impossible de vous contacter vous-même", status: 400 };
    }

    const provider = await prisma.user.findFirst({
      where: { id: providerId, role: { in: ["PROVIDER", "ADMIN"] } },
      select: { id: true },
    });

    if (!provider) {
      return { error: "Prestataire introuvable", status: 404 };
    }

    return { clientId: userId, providerId };
  }

  if (clientId) {
    if (role !== "PROVIDER" && role !== "ADMIN") {
      return {
        error: "Seuls les prestataires peuvent contacter un client ainsi",
        status: 403,
      };
    }
    if (clientId === userId) {
      return { error: "Impossible de vous contacter vous-même", status: 400 };
    }

    const client = await prisma.user.findFirst({
      where: { id: clientId, role: { in: ["CLIENT", "ADMIN"] } },
      select: { id: true },
    });

    if (!client) {
      return { error: "Client introuvable", status: 404 };
    }

    return { clientId, providerId: userId };
  }

  return { error: "Paramètre invalide", status: 400 };
}

export async function upsertConversationForPair(
  clientId: string,
  providerId: string
) {
  return prisma.conversation.upsert({
    where: {
      clientId_providerId: { clientId, providerId },
    },
    create: { clientId, providerId },
    update: {},
    select: { id: true },
  });
}
