import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireAuth } from "@/lib/auth";
import { assertProviderKycApproved } from "@/lib/provider-kyc";
import { assertEmailVerified } from "@/lib/email-verification";
import {
  FIELD_LIMITS,
  validateTextIfPresent,
} from "@/lib/field-limits";
import { isKycApproved } from "@/lib/kyc";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import { clearServiceFeaturedIfNeeded } from "@/lib/provider-spotlight";
import { withCoverImageUrl } from "@/lib/listing-cover";
import { deleteListingCoverFiles } from "@/lib/listing-cover-storage";

// ─── GET /api/services/[id] ───────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id:     true,
            name:   true,
            avatar: true,
            bio:    true,
            phone:  true,
            kycStatus: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service introuvable" },
        { status: 404 }
      );
    }

    const viewer = getAuthUser(_req);
    const isOwner =
      viewer?.userId === service.providerId || viewer?.role === "ADMIN";

    if (
      !service.available ||
      (!isOwner && !isKycApproved(service.provider.kycStatus))
    ) {
      return NextResponse.json(
        { error: "Service introuvable" },
        { status: 404 }
      );
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
            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
          ) / 10
        : 0;

    return NextResponse.json({
      service: withCoverImageUrl("service", service),
      reviews,
      averageRating,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("[GET /api/services/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── PATCH /api/services/[id] ───────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const service = await prisma.service.findUnique({ where: { id } });

    if (!service) {
      return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
    }

    if (service.providerId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
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

    const { title, description, price, category, location, available } = body;

    for (const check of [
      validateTextIfPresent(title, "Titre", FIELD_LIMITS.LISTING_TITLE),
      validateTextIfPresent(
        description,
        "Description",
        FIELD_LIMITS.LISTING_DESCRIPTION
      ),
      validateTextIfPresent(category, "Catégorie", FIELD_LIMITS.LISTING_CATEGORY),
      validateTextIfPresent(location, "Ville", FIELD_LIMITS.LISTING_LOCATION),
    ]) {
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
    }

    if (
      category &&
      !(SERVICE_CATEGORIES as readonly string[]).includes(category)
    ) {
      return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(category !== undefined && { category }),
        ...(location !== undefined && { location: String(location).trim() }),
        ...(available !== undefined && { available: Boolean(available) }),
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
  } catch (error) {
    console.error("[PATCH /api/services/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── DELETE /api/services/[id] ──────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const service = await prisma.service.findUnique({ where: { id } });

    if (!service) {
      return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
    }

    if (service.providerId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
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
  } catch (error) {
    console.error("[DELETE /api/services/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}