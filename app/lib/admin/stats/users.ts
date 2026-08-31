import prisma from "@/lib/prisma";
import { isSubscriptionActive } from "@/lib/subscription";
import { EXPORT_PAGE_SIZE, idCursorWhere } from "@/lib/admin/stats/shared";

export async function loadUserAdminStats(
  now: Date,
  last30: Date,
  expiringSoon: Date
) {
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
    featuredProviders,
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
    prisma.user.count({
      where: {
        role: "PROVIDER",
        featuredOnHomepage: true,
        providerSubscription: { is: { expiresAt: { gt: now } } },
      },
    }),
  ]);

  return {
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
  };
}

export async function exportProvidersCsv() {
  const rows: unknown[][] = [];
  for await (const row of iterateProvidersCsv()) {
    rows.push(row);
  }
  return rows;
}

export async function* iterateProvidersCsv(): AsyncGenerator<unknown[]> {
  const now = new Date();
  let cursorId: string | null = null;

  for (;;) {
    const after = idCursorWhere(cursorId);
    const batch = await prisma.user.findMany({
      where: {
        role: "PROVIDER",
        ...(after ?? {}),
      },
      orderBy: { id: "asc" },
      take: EXPORT_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        kycStatus: true,
        featuredOnHomepage: true,
        createdAt: true,
        providerSubscription: {
          select: { startsAt: true, expiresAt: true, notes: true },
        },
        _count: {
          select: {
            services: true,
            bookingsAsProvider: true,
            reviewsReceived: true,
          },
        },
      },
    });

    if (batch.length === 0) break;

    for (const p of batch) {
      yield [
        p.id,
        p.name,
        p.email,
        p.phone ?? "",
        p.kycStatus,
        isSubscriptionActive(p.providerSubscription?.expiresAt, now)
          ? "Oui"
          : "Non",
        p.providerSubscription?.expiresAt.toISOString() ?? "",
        p.providerSubscription?.notes ?? "",
        p._count.services,
        p._count.bookingsAsProvider,
        p._count.reviewsReceived,
        p.featuredOnHomepage ? "Oui" : "Non",
        p.createdAt.toISOString(),
      ];
    }

    const last = batch[batch.length - 1];
    if (!last) break;
    cursorId = last.id;
    if (batch.length < EXPORT_PAGE_SIZE) break;
  }
}

export async function exportClientsCsv() {
  const rows: unknown[][] = [];
  for await (const row of iterateClientsCsv()) {
    rows.push(row);
  }
  return rows;
}

export async function* iterateClientsCsv(): AsyncGenerator<unknown[]> {
  let cursorId: string | null = null;

  for (;;) {
    const after = idCursorWhere(cursorId);
    const batch = await prisma.user.findMany({
      where: {
        role: "CLIENT",
        ...(after ?? {}),
      },
      orderBy: { id: "asc" },
      take: EXPORT_PAGE_SIZE,
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

    if (batch.length === 0) break;

    for (const c of batch) {
      yield [
        c.id,
        c.name,
        c.email,
        c.phone ?? "",
        c.emailVerified ? "Oui" : "Non",
        c._count.bookingsAsClient,
        c._count.serviceRequests,
        c._count.reviewsGiven,
        c.createdAt.toISOString(),
      ];
    }

    const last = batch[batch.length - 1];
    if (!last) break;
    cursorId = last.id;
    if (batch.length < EXPORT_PAGE_SIZE) break;
  }
}

export async function exportSubscriptionsCsv() {
  const rows: unknown[][] = [];
  for await (const row of iterateSubscriptionsCsv()) {
    rows.push(row);
  }
  return rows;
}

export async function* iterateSubscriptionsCsv(): AsyncGenerator<unknown[]> {
  const now = new Date();
  let cursorId: string | null = null;

  for (;;) {
    const whereClause:
      | { providerId: { gt: string } }
      | undefined = cursorId ? { providerId: { gt: cursorId } } : undefined;
    const batch: Array<{
      startsAt: Date;
      expiresAt: Date;
      notes: string | null;
      provider: {
        id: string;
        name: string;
        email: string;
        kycStatus: string;
      };
    }> = await prisma.providerSubscription.findMany({
      where: whereClause,
      orderBy: { providerId: "asc" },
      take: EXPORT_PAGE_SIZE,
      select: {
        startsAt: true,
        expiresAt: true,
        notes: true,
        provider: {
          select: { id: true, name: true, email: true, kycStatus: true },
        },
      },
    });

    if (batch.length === 0) break;

    for (const s of batch) {
      yield [
        s.provider.id,
        s.provider.name,
        s.provider.email,
        s.provider.kycStatus,
        s.startsAt.toISOString(),
        s.expiresAt.toISOString(),
        isSubscriptionActive(s.expiresAt, now) ? "Actif" : "Expiré",
        s.notes ?? "",
      ];
    }

    const last = batch[batch.length - 1];
    if (!last) break;
    cursorId = last.provider.id;
    if (batch.length < EXPORT_PAGE_SIZE) break;
  }
}
