import prisma from "@/lib/prisma";
import { getBookingDisplayInfo } from "@/lib/booking-display";
import { formatSchedule } from "@/lib/datetime-slot";
import { dispatchNotification } from "@/lib/notifications";
import { NOTIFICATION_TYPES } from "@/lib/notification-types";

async function loadBookingContext(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
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
      provider: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function notifyBookingCreated(bookingId: string) {
  const booking = await loadBookingContext(bookingId);
  if (!booking || booking.status !== "PENDING") return;

  const display = getBookingDisplayInfo(booking);
  if (!display) return;

  const dateLabel = formatSchedule(
    booking.date,
    booking.slotStart,
    booking.slotEnd
  );

  await dispatchNotification({
    userId: booking.providerId,
    type: NOTIFICATION_TYPES.BOOKING_CREATED,
    title: "Nouvelle réservation",
    body: `${booking.client.name} a réservé « ${display.title} » pour le ${dateLabel}.`,
    link: "/dashboard/provider",
  });
}

export async function notifyBookingConfirmed(bookingId: string) {
  const booking = await loadBookingContext(bookingId);
  if (!booking) return;

  const display = getBookingDisplayInfo(booking);
  if (!display) return;

  const dateLabel = formatSchedule(
    booking.date,
    booking.slotStart,
    booking.slotEnd
  );
  const body = `Votre réservation « ${display.title} » est confirmée pour le ${dateLabel}.`;

  await dispatchNotification({
    userId: booking.clientId,
    type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
    title: "Réservation confirmée",
    body,
    link: "/dashboard/client",
  });

  await dispatchNotification({
    userId: booking.providerId,
    type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
    title: "Réservation confirmée",
    body,
    link: "/dashboard/provider",
  });
}

export async function notifyBookingCompleted(bookingId: string) {
  const booking = await loadBookingContext(bookingId);
  if (!booking) return;

  const display = getBookingDisplayInfo(booking);
  if (!display) return;

  await dispatchNotification({
    userId: booking.clientId,
    type: NOTIFICATION_TYPES.BOOKING_COMPLETED,
    title: "Prestation terminée",
    body: `La prestation « ${display.title} » est marquée comme terminée. Vous pouvez laisser un avis.`,
    link: "/dashboard/client",
  });

  await dispatchNotification({
    userId: booking.providerId,
    type: NOTIFICATION_TYPES.BOOKING_COMPLETED,
    title: "Prestation terminée",
    body: `La prestation « ${display.title} » est marquée comme terminée. Votre facture peut être téléchargée.`,
    link: "/dashboard/provider",
  });
}

export async function notifyBookingCancelled(bookingId: string) {
  const booking = await loadBookingContext(bookingId);
  if (!booking) return;

  const display = getBookingDisplayInfo(booking);
  if (!display) return;

  const body = `La réservation « ${display.title} » a été annulée.`;

  await dispatchNotification({
    userId: booking.clientId,
    type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
    title: "Réservation annulée",
    body,
    link: "/dashboard/client",
  });

  await dispatchNotification({
    userId: booking.providerId,
    type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
    title: "Réservation annulée",
    body,
    link: "/dashboard/provider",
  });
}
