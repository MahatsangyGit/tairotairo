import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import { isKycApproved } from "@/lib/kyc";
import { stripPhone } from "@/lib/contact-privacy";
import { withCoverImageUrl } from "@/lib/listing-cover";
import { paidReviewWhere } from "@/lib/paid-reviews";
import { withEiFlag } from "@/lib/provider-legal";
import {
  handleServiceDelete,
  handleServicePatch,
} from "@/lib/listing-crud-handlers";

export const GET = withApiHandler(
  "GET /api/services/[id]",
  async (req, { params }) => {
    const { id } = await params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
            phone: true,
            kycStatus: true,
            nif: true,
            stat: true,
            rcs: true,
          },
        },
      },
    });

    if (!service) {
      throwNotFound("Service introuvable");
    }

    const viewer = await getAuthUser(req);
    const isOwner =
      viewer?.userId === service.providerId || viewer?.role === "ADMIN";

    if (
      !service.available ||
      (!isOwner && !isKycApproved(service.provider.kycStatus))
    ) {
      throwNotFound("Service introuvable");
    }

    const where = paidReviewWhere(service.providerId);

    const [reviews, totalReviews, aggregate] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
      }),
    ]);

    const averageRating = aggregate._avg.rating
      ? Math.round(aggregate._avg.rating * 10) / 10
      : 0;

    return NextResponse.json({
      service: withCoverImageUrl("service", {
        ...service,
        provider: withEiFlag(stripPhone(service.provider)),
      }),
      reviews,
      averageRating,
      totalReviews,
    });
  }
);

export const PATCH = withApiHandler(
  "PATCH /api/services/[id]",
  async (req, { params }) => {
    const { id } = await params;
    return handleServicePatch(req, id);
  }
);

export const DELETE = withApiHandler(
  "DELETE /api/services/[id]",
  async (req, { params }) => {
    const { id } = await params;
    return handleServiceDelete(req, id);
  }
);
