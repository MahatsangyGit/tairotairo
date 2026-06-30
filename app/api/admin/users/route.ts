import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import type { Prisma, Role } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;

    const params = req.nextUrl.searchParams;
    const role = params.get("role");
    const status = params.get("status") ?? "all";
    const q = params.get("q")?.trim() ?? "";
    const page = Math.max(1, Number(params.get("page") ?? "1") || 1);

    const where: Prisma.UserWhereInput = {};

    if (role && role !== "all" && ["CLIENT", "PROVIDER", "ADMIN"].includes(role)) {
      where.role = role as Role;
    }

    if (status === "active") {
      where.suspendedAt = null;
    } else if (status === "suspended") {
      where.suspendedAt = { not: null };
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, users, counts] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: [{ suspendedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          suspendedAt: true,
          loginLockedAt: true,
          failedLoginAttempts: true,
          kycStatus: true,
          createdAt: true,
          _count: {
            select: {
              services: true,
              serviceRequests: true,
              bookingsAsClient: true,
              bookingsAsProvider: true,
            },
          },
        },
      }),
      Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "CLIENT" } }),
        prisma.user.count({ where: { role: "PROVIDER" } }),
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.user.count({ where: { suspendedAt: { not: null } } }),
        prisma.user.count({ where: { loginLockedAt: { not: null } } }),
      ]),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        suspendedAt: u.suspendedAt?.toISOString() ?? null,
        loginLockedAt: u.loginLockedAt?.toISOString() ?? null,
        failedLoginAttempts: u.failedLoginAttempts,
        kycStatus: u.role === "PROVIDER" ? u.kycStatus : null,
        createdAt: u.createdAt.toISOString(),
        stats: {
          services: u._count.services,
          requests: u._count.serviceRequests,
          bookingsAsClient: u._count.bookingsAsClient,
          bookingsAsProvider: u._count.bookingsAsProvider,
        },
      })),
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
      counts: {
        all: counts[0],
        clients: counts[1],
        providers: counts[2],
        admins: counts[3],
        suspended: counts[4],
        loginLocked: counts[5],
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
