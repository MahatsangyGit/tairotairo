import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireAuthOrThrow } from "@/lib/auth";
import {
  withApiHandler,
  throwForbidden,
  throwNotFound,
} from "@/lib/api-handler";
import { assertProviderKycApproved } from "@/lib/provider-kyc";
import { assertEmailVerified } from "@/lib/email-verification";
import { isKycApproved } from "@/lib/kyc";
import { stripPhone } from "@/lib/contact-privacy";
import { clearServiceFeaturedIfNeeded } from "@/lib/provider-spotlight";
import { withCoverImageUrl } from "@/lib/listing-cover";
import { deleteListingCoverFiles } from "@/lib/listing-cover-storage";
import {
  parseBody,
  parseJsonBody,
  patchServiceSchema,
} from "@/lib/api-schemas";

// ─── GET /api/services/[id] ───────────────────────────────────────────────────

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

    // Avis du prestataire
    const reviews = await prisma.review.findMany({
      where: { targetId: service.providerId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    const averageRating =
      reviews.length > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) *
              10
          ) / 10
        : 0;

    return NextResponse.json({
      service: withCoverImageUrl("service", {
        ...service,
        provider: stripPhone(service.provider),
      }),
      reviews,
      averageRating,
      totalReviews: reviews.length,
    });
  }
);

// ─── PATCH /api/services/[id] ───────────────────────────────────────────────────

export const PATCH = withApiHandler(
  "PATCH /api/services/[id]",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);
    const { id } = await params;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(patchServiceSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const service = await prisma.service.findUnique({ where: { id } });

    if (!service) {
      throwNotFound("Service introuvable");
    }

    if (service.providerId !== user.userId && user.role !== "ADMIN") {
      throwForbidden("Accès refusé");
    }

    if (user.role === "PROVIDER") {
      const kycCheck = await assertProviderKycApproved(user.userId, user.role);
      if (!kycCheck.ok) {
        return NextResponse.json(
          { error: kycCheck.error },
          { status: kycCheck.status }
        );
      }

      const emailCheck = await assertEmailVerified(user.userId, user.role);
      if (!emailCheck.ok) {
        return NextResponse.json(
          { error: emailCheck.error },
          { status: emailCheck.status }
        );
      }
    }

    const { title, description, price, category, location, available } =
      parsed.data;

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(category !== undefined && { category }),
        ...(location !== undefined && { location }),
        ...(available !== undefined && { available }),
      },
    });

    if (available === false && service.featuredOnHomepage) {
      await clearServiceFeaturedIfNeeded(id);
      updated.featuredOnHomepage = false;
      updated.featuredOnHomepageAt = null;
    }

    return NextResponse.json({
      message: "Service mis à jour",
      service: withCoverImageUrl("service", updated),
    });
  }
);

// ─── DELETE /api/services/[id] ──────────────────────────────────────────────────

export const DELETE = withApiHandler(
  "DELETE /api/services/[id]",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);
    const { id } = await params;

    const service = await prisma.service.findUnique({ where: { id } });

    if (!service) {
      throwNotFound("Service introuvable");
    }

    if (service.providerId !== user.userId && user.role !== "ADMIN") {
      throwForbidden("Accès refusé");
    }

    const activeBookings = await prisma.booking.count({
      where: {
        serviceId: id,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer : des réservations sont en cours. Désactivez l'annonce à la place.",
        },
        { status: 400 }
      );
    }

    await deleteListingCoverFiles("service", id);
    await prisma.service.delete({ where: { id } });

    return NextResponse.json({ message: "Service supprimé" });
  }
);
