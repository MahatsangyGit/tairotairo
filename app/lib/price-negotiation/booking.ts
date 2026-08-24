import prisma from "@/lib/prisma";
import { PriceOfferStatus } from "@/generated/prisma/enums";
import {
  resolveBookingSchedule,
  snapshotFromRequest,
  snapshotFromService,
} from "@/lib/booking-display";
import { withServiceCommission } from "@/lib/economy";
import { formatPriceAcceptedBody } from "@/lib/message-serialize";
import {
  notifyBookingConfirmed,
  notifyBookingCreated,
} from "@/lib/notify-booking";
import { notifyRequestResponseAccepted } from "@/lib/notify-requests";
import {
  loadOfferForAccept,
  supersedePendingOffers,
} from "@/lib/price-negotiation/context";

function defaultServiceBookingDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(9, 0, 0, 0);
  return d;
}

export async function acceptRequestPriceOffer(
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
      messageId,
      tx
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

      const schedule = resolveBookingSchedule({
        desiredDate: request.desiredDate,
        desiredSlotStart: request.desiredSlotStart,
        desiredSlotEnd: request.desiredSlotEnd,
      });

      booking = await tx.booking.create({
        data: {
          clientId: request.clientId,
          providerId: response.providerId,
          requestResponseId: response.id,
          date: schedule.date,
          slotStart: schedule.slotStart,
          slotEnd: schedule.slotEnd,
          status: "CONFIRMED",
          ...withServiceCommission(snapshot),
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
        data: withServiceCommission(snapshot, booking.commissionRate),
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

      const scheduleAccepted = resolveBookingSchedule({
        desiredDate: request.desiredDate,
        desiredSlotStart: request.desiredSlotStart,
        desiredSlotEnd: request.desiredSlotEnd,
      });

      booking = await tx.booking.create({
        data: {
          clientId: request.clientId,
          providerId: response.providerId,
          requestResponseId: response.id,
          date: scheduleAccepted.date,
          slotStart: scheduleAccepted.slotStart,
          slotEnd: scheduleAccepted.slotEnd,
          status: "CONFIRMED",
          ...withServiceCommission(snapshot),
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

export async function acceptServicePriceOffer(
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
      messageId,
      tx
    );

    const pairWhere = {
      clientId: offer.conversation.clientId,
      providerId: offer.conversation.providerId,
      serviceId: service.id,
      status: { notIn: ["CANCELLED" as const] },
    };

    const existing = await tx.booking.findFirst({
      where: pairWhere,
      orderBy: { updatedAt: "desc" },
    });

    const snapshot = withServiceCommission(
      snapshotFromService(service, price),
      existing?.commissionRate
    );

    const wasNew = !existing;

    if (existing) {
      await tx.booking.updateMany({
        where: pairWhere,
        data: snapshot,
      });
    } else {
      await tx.booking.create({
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

    const booking = await tx.booking.findFirst({
      where: pairWhere,
      orderBy: { updatedAt: "desc" },
    });

    if (!booking) {
      throw new Error("Réservation introuvable après acceptation");
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
