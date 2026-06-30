import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertProviderKycApproved } from "@/lib/provider-kyc";
import { assertEmailVerified } from "@/lib/email-verification";
import { parseListSearchParams } from "@/lib/advanced-search";
import { searchPublicServices } from "@/lib/service-list-search";
import { withCoverImageUrl } from "@/lib/listing-cover";
import { jsonWithPublicCache } from "@/lib/cache";
import {
  createServiceSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";

// GET - Lister et rechercher les services (?mine=true pour le prestataire connecté)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine") === "true";

    if (mine) {
      const user = await requireAuth(req);

      if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }

      if (user.role !== "PROVIDER" && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Réservé aux prestataires" },
          { status: 403 }
        );
      }

      const services = await prisma.service.findMany({
        where: { providerId: user.userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          category: true,
          location: true,
          coverImageMime: true,
          available: true,
          featuredOnHomepage: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        services: services.map((s) => withCoverImageUrl("service", s)),
      });
    }

    const params = parseListSearchParams(searchParams);
    const result = await searchPublicServices(params);

    return jsonWithPublicCache(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer un service
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    if (user.role !== "PROVIDER") {
      return NextResponse.json(
        { error: "Seuls les prestataires peuvent créer un service" },
        { status: 403 }
      );
    }

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

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(createServiceSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { title, description, price, category, location } = parsed.data;

    const service = await prisma.service.create({
      data: {
        title,
        description,
        price,
        category,
        location,
        providerId: user.userId,
      },
    });

    return NextResponse.json(
      { message: "Service créé avec succès", service },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}