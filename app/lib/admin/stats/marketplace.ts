import prisma from "@/lib/prisma";
import { EXPORT_PAGE_SIZE, idCursorWhere } from "@/lib/admin/stats/shared";

export async function loadMarketplaceAdminStats(last30: Date) {
  const [
    servicesTotal,
    servicesAvailable,
    servicesFeatured,
    bookingsTotal,
    bookingsPending,
    bookingsConfirmed,
    bookingsCompleted,
    bookingsCancelled,
    bookingsLast30,
    requestsOpen,
    requestsTotal,
    reviewsAgg,
    conversationsTotal,
    messagesTotal,
    transactionsSuccess,
    revenueAgg,
    topCategories,
  ] = await Promise.all([
    prisma.service.count(),
    prisma.service.count({ where: { available: true } }),
    prisma.service.count({ where: { featuredOnHomepage: true } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.booking.count({ where: { createdAt: { gte: last30 } } }),
    prisma.serviceRequest.count({ where: { open: true } }),
    prisma.serviceRequest.count(),
    prisma.review.aggregate({ _count: true, _avg: { rating: true } }),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.transaction.count({
      where: { status: { in: ["ESCROWED", "RELEASED"] } },
    }),
    prisma.transaction.aggregate({
      where: { status: { in: ["ESCROWED", "RELEASED"] } },
      _sum: { amount: true },
    }),
    prisma.service.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
      take: 5,
    }),
  ]);

  return {
    services: {
      total: servicesTotal,
      available: servicesAvailable,
      featured: servicesFeatured,
      topCategories: topCategories.map((c) => ({
        category: c.category,
        count: c._count.category,
      })),
    },
    bookings: {
      total: bookingsTotal,
      pending: bookingsPending,
      confirmed: bookingsConfirmed,
      completed: bookingsCompleted,
      cancelled: bookingsCancelled,
      last30Days: bookingsLast30,
    },
    requests: {
      open: requestsOpen,
      total: requestsTotal,
    },
    reviews: {
      total: reviewsAgg._count,
      averageRating:
        reviewsAgg._avg?.rating != null
          ? Math.round(reviewsAgg._avg.rating * 10) / 10
          : null,
    },
    messaging: {
      conversations: conversationsTotal,
      messages: messagesTotal,
    },
    transactions: {
      successful: transactionsSuccess,
      totalRevenue: revenueAgg._sum?.amount ?? 0,
    },
  };
}

export async function exportServicesCsv() {
  const rows: unknown[][] = [];
  for await (const row of iterateServicesCsv()) {
    rows.push(row);
  }
  return rows;
}

export async function* iterateServicesCsv(): AsyncGenerator<unknown[]> {
  let cursorId: string | null = null;

  for (;;) {
    const after = idCursorWhere(cursorId);
    const batch = await prisma.service.findMany({
      where: after,
      orderBy: { id: "asc" },
      take: EXPORT_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        category: true,
        price: true,
        location: true,
        available: true,
        featuredOnHomepage: true,
        createdAt: true,
        provider: { select: { name: true, email: true } },
      },
    });

    if (batch.length === 0) break;

    for (const s of batch) {
      yield [
        s.id,
        s.title,
        s.category,
        s.price,
        s.location,
        s.available ? "Oui" : "Non",
        s.featuredOnHomepage ? "Oui" : "Non",
        s.provider.name,
        s.provider.email,
        s.createdAt.toISOString(),
      ];
    }

    const last = batch[batch.length - 1];
    if (!last) break;
    cursorId = last.id;
    if (batch.length < EXPORT_PAGE_SIZE) break;
  }
}

export async function exportBookingsCsv() {
  const rows: unknown[][] = [];
  for await (const row of iterateBookingsCsv()) {
    rows.push(row);
  }
  return rows;
}

export async function* iterateBookingsCsv(): AsyncGenerator<unknown[]> {
  let cursorId: string | null = null;

  for (;;) {
    const after = idCursorWhere(cursorId);
    const batch = await prisma.booking.findMany({
      where: after,
      orderBy: { id: "asc" },
      take: EXPORT_PAGE_SIZE,
      select: {
        id: true,
        status: true,
        date: true,
        slotStart: true,
        slotEnd: true,
        displayTitle: true,
        displayPrice: true,
        displayCategory: true,
        displayLocation: true,
        createdAt: true,
        client: { select: { name: true, email: true } },
        provider: { select: { name: true, email: true } },
        service: { select: { title: true } },
      },
    });

    if (batch.length === 0) break;

    for (const b of batch) {
      yield [
        b.id,
        b.status,
        b.date?.toISOString() ?? "",
        b.slotStart ?? "",
        b.slotEnd ?? "",
        b.displayTitle ?? b.service?.title ?? "",
        b.displayPrice ?? "",
        b.displayCategory ?? "",
        b.displayLocation ?? "",
        b.client.name,
        b.client.email,
        b.provider.name,
        b.provider.email,
        b.createdAt.toISOString(),
      ];
    }

    const last = batch[batch.length - 1];
    if (!last) break;
    cursorId = last.id;
    if (batch.length < EXPORT_PAGE_SIZE) break;
  }
}
