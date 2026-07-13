import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withApiHandler } from "@/lib/api-handler";
import { requireAdmin } from "@/lib/admin-auth";
import { validateKycCompleteness } from "@/lib/kyc";

export const dynamic = "force-dynamic";

export const GET = withApiHandler("GET /api/admin/kyc", async (req) => {
  const auth = await requireAdmin(req);

  const filter = req.nextUrl.searchParams.get("filter") ?? "pending";

  const where =
    filter === "pending"
      ? { role: "PROVIDER" as const, kycStatus: "PENDING" as const }
      : filter === "approved"
        ? { role: "PROVIDER" as const, kycStatus: "APPROVED" as const }
        : {
            role: "PROVIDER" as const,
            OR: [
              { kycStatus: "PENDING" as const },
              { kycStatus: "APPROVED" as const },
              { kycDocuments: { some: {} } },
            ],
          };

  const providers = await prisma.user.findMany({
    where,
    orderBy: [
      { kycStatus: "asc" },
      { kycSubmittedAt: "desc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      kycStatus: true,
      kycSubmittedAt: true,
      createdAt: true,
      kycDocuments: {
        orderBy: [{ type: "asc" }, { cinSlot: "asc" }],
        select: {
          id: true,
          type: true,
          cinSlot: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
      },
    },
  });

  const counts = await Promise.all([
    prisma.user.count({ where: { role: "PROVIDER", kycStatus: "PENDING" } }),
    prisma.user.count({ where: { role: "PROVIDER", kycStatus: "APPROVED" } }),
    prisma.user.count({
      where: {
        role: "PROVIDER",
        kycStatus: "NOT_STARTED",
        kycDocuments: { some: {} },
      },
    }),
  ]);

  return NextResponse.json({
    counts: {
      pending: counts[0],
      approved: counts[1],
      incomplete: counts[2],
    },
    providers: providers.map((p) => {
      const docs = p.kycDocuments.map((d) => ({
        id: d.id,
        type: d.type,
        cinSlot: d.cinSlot,
        originalName: d.originalName,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        createdAt: d.createdAt.toISOString(),
      }));
      const completeness = validateKycCompleteness(docs);

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        kycStatus: p.kycStatus,
        kycSubmittedAt: p.kycSubmittedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        documents: docs,
        isComplete: completeness.ok,
      };
    }),
  });
});
