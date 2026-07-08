import prisma from "@/lib/prisma";
import { isSubscriptionActive } from "@/lib/subscription";

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

export async function getAdminStats() {
  const now = new Date();
  const last30 = daysAgo(30);
  const expiringSoon = new Date();
  expiringSoon.setDate(expiringSoon.getDate() + 7);

  const [
    clients,
    providers,
    admins,
    newClients30,
    newProviders30,
    kycApproved,
    kycPending,
    kycNotStarted,
    activeSubscriptions,
    expiringSubscriptions,
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
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.user.count({ where: { role: "PROVIDER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({
      where: { role: "CLIENT", createdAt: { gte: last30 } },
    }),
    prisma.user.count({
      where: { role: "PROVIDER", createdAt: { gte: last30 } },
    }),
    prisma.user.count({
      where: { role: "PROVIDER", kycStatus: "APPROVED" },
    }),
    prisma.user.count({
      where: { role: "PROVIDER", kycStatus: "PENDING" },
    }),
    prisma.user.count({
      where: { role: "PROVIDER", kycStatus: "NOT_STARTED" },
    }),
    prisma.providerSubscription.count({
      where: { expiresAt: { gt: now } },
    }),
    prisma.providerSubscription.count({
      where: { expiresAt: { gt: now, lte: expiringSoon } },
    }),
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
  ]);

  const topCategories = await prisma.service.groupBy({
    by: ["category"],
    _count: { category: true },
    orderBy: { _count: { category: "desc" } },
    take: 5,
  });

  const featuredProviders = await prisma.user.count({
    where: {
      role: "PROVIDER",
      featuredOnHomepage: true,
      providerSubscription: { is: { expiresAt: { gt: now } } },
    },
  });

  return {
    generatedAt: now.toISOString(),
    users: {
      clients,
      providers,
      admins,
      newClients30,
      newProviders30,
    },
    kyc: {
      approved: kycApproved,
      pending: kycPending,
      notStarted: kycNotStarted,
    },
    subscriptions: {
      active: activeSubscriptions,
      expiringSoon: expiringSubscriptions,
      featuredProviders,
    },
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

export async function exportProvidersCsv() {
  const now = new Date();
  const rows = await prisma.user.findMany({
    where: { role: "PROVIDER" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      kycStatus: true,
      featuredOnHomepage: true,
      createdAt: true,
      providerSubscription: { select: { startsAt: true, expiresAt: true, notes: true } },
      _count: { select: { services: true, bookingsAsProvider: true, reviewsReceived: true } },
    },
  });

  return rows.map((p) => [
    p.id,
    p.name,
    p.email,
    p.phone ?? "",
    p.kycStatus,
    isSubscriptionActive(p.providerSubscription?.expiresAt, now) ? "Oui" : "Non",
    p.providerSubscription?.expiresAt.toISOString() ?? "",
    p.providerSubscription?.notes ?? "",
    p._count.services,
    p._count.bookingsAsProvider,
    p._count.reviewsReceived,
    p.featuredOnHomepage ? "Oui" : "Non",
    p.createdAt.toISOString(),
  ]);
}

export async function exportServicesCsv() {
  const rows = await prisma.service.findMany({
    orderBy: { createdAt: "desc" },
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

  return rows.map((s) => [
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
  ]);
}

export async function exportBookingsCsv() {
  const rows = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
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

  return rows.map((b) => [
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
  ]);
}

export async function exportClientsCsv() {
  const rows = await prisma.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      emailVerified: true,
      createdAt: true,
      _count: {
        select: {
          bookingsAsClient: true,
          serviceRequests: true,
          reviewsGiven: true,
        },
      },
    },
  });

  return rows.map((c) => [
    c.id,
    c.name,
    c.email,
    c.phone ?? "",
    c.emailVerified ? "Oui" : "Non",
    c._count.bookingsAsClient,
    c._count.serviceRequests,
    c._count.reviewsGiven,
    c.createdAt.toISOString(),
  ]);
}

export async function exportSubscriptionsCsv() {
  const now = new Date();
  const rows = await prisma.providerSubscription.findMany({
    orderBy: { expiresAt: "desc" },
    select: {
      startsAt: true,
      expiresAt: true,
      notes: true,
      provider: { select: { id: true, name: true, email: true, kycStatus: true } },
    },
  });

  return rows.map((s) => [
    s.provider.id,
    s.provider.name,
    s.provider.email,
    s.provider.kycStatus,
    s.startsAt.toISOString(),
    s.expiresAt.toISOString(),
    isSubscriptionActive(s.expiresAt, now) ? "Actif" : "Expiré",
    s.notes ?? "",
  ]);
}
