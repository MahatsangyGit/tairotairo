import prisma from "@/lib/prisma";
import { APP_URL } from "@/lib/email";
import {
  sendBookingConfirmedEmail,
  sendBookingCreatedEmail,
} from "@/lib/email";
import { getBookingDisplayInfo } from "@/lib/booking-display";

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-MG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function notifyBookingCreated(bookingId: string) {
  const booking = await prisma.booking.findUnique({
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
      provider: { select: { name: true, email: true } },
      client: { select: { name: true, email: true } },
    },
  });

  if (!booking || booking.status !== "PENDING") return;

  const display = getBookingDisplayInfo(booking);
  if (!display) return;

  await sendBookingCreatedEmail({
    to: booking.provider.email,
    recipientName: booking.provider.name,
    serviceTitle: display.title,
    dateLabel: formatDate(booking.date),
    dashboardUrl: `${APP_URL}/dashboard/provider`,
  });
}

export async function notifyBookingConfirmed(bookingId: string) {
  const booking = await prisma.booking.findUnique({
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
      provider: { select: { name: true, email: true } },
      client: { select: { name: true, email: true } },
    },
  });

  if (!booking) return;

  const display = getBookingDisplayInfo(booking);
  if (!display) return;

  const dateLabel = formatDate(booking.date);

  await Promise.all([
    sendBookingConfirmedEmail({
      to: booking.client.email,
      recipientName: booking.client.name,
      serviceTitle: display.title,
      dateLabel,
      dashboardUrl: `${APP_URL}/dashboard/client`,
    }),
    sendBookingConfirmedEmail({
      to: booking.provider.email,
      recipientName: booking.provider.name,
      serviceTitle: display.title,
      dateLabel,
      dashboardUrl: `${APP_URL}/dashboard/provider`,
    }),
  ]);
}
