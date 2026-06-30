import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { parseListSearchParams } from "@/lib/advanced-search";
import { searchPublicRequests } from "@/lib/request-list-search";
import {
  parseScheduleInput,
  scheduleFieldsForDb,
} from "@/lib/datetime-slot";
import { assertEmailVerified } from "@/lib/email-verification";
import { FIELD_LIMITS, validateRequiredText } from "@/lib/field-limits";
import { withCoverImageUrl } from "@/lib/listing-cover";
import { jsonWithPublicCache } from "@/lib/cache";

// GET - Lister les demandes (?mine=true pour le client connecté)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine") === "true";

    if (mine) {
      const user = await requireAuth(req);

      if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }

      if (user.role !== "CLIENT" && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Réservé aux clients" },
          { status: 403 }
        );
      }

      const requests = await prisma.serviceRequest.findMany({
        where: { clientId: user.userId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { responses: true } },
        },
      });

      return NextResponse.json({
        requests: requests.map((r) => withCoverImageUrl("request", r)),
      });
    }

    const params = parseListSearchParams(searchParams);
    const result = await searchPublicRequests(params);

    return jsonWithPublicCache(result);
  } catch (error) {
    console.error("[GET /api/requests]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Publier une demande de service (client)
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (user.role !== "CLIENT" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Seuls les clients peuvent publier une demande" },
        { status: 403 }
      );
    }

    if (user.role === "CLIENT") {
      const emailCheck = await assertEmailVerified(user.userId, user.role);
      if (!emailCheck.ok) {
        return NextResponse.json(
          { error: emailCheck.error },
          { status: emailCheck.status }
        );
      }
    }

    const body = await req.json();
    const { title, description, budget, category, location } = body;
    const schedule = parseScheduleInput(body);

    if (schedule.error) {
      return NextResponse.json({ error: schedule.error }, { status: 400 });
    }

    const desired = scheduleFieldsForDb(schedule);

    const titleCheck = validateRequiredText(
      title,
      "Titre",
      FIELD_LIMITS.LISTING_TITLE
    );
    if (!titleCheck.ok) {
      return NextResponse.json({ error: titleCheck.error }, { status: 400 });
    }

    const descriptionCheck = validateRequiredText(
      description,
      "Description",
      FIELD_LIMITS.LISTING_DESCRIPTION
    );
    if (!descriptionCheck.ok) {
      return NextResponse.json(
        { error: descriptionCheck.error },
        { status: 400 }
      );
    }

    const categoryCheck = validateRequiredText(
      category,
      "Catégorie",
      FIELD_LIMITS.LISTING_CATEGORY
    );
    if (!categoryCheck.ok) {
      return NextResponse.json({ error: categoryCheck.error }, { status: 400 });
    }

    const locationCheck = validateRequiredText(
      location,
      "Ville",
      FIELD_LIMITS.LISTING_LOCATION
    );
    if (!locationCheck.ok) {
      return NextResponse.json({ error: locationCheck.error }, { status: 400 });
    }

    if (!budget) {
      return NextResponse.json(
        { error: "Titre, description, budget, catégorie et ville sont obligatoires" },
        { status: 400 }
      );
    }

    const parsedBudget = parseFloat(budget);
    if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
      return NextResponse.json({ error: "Budget invalide" }, { status: 400 });
    }

    const request = await prisma.serviceRequest.create({
      data: {
        title: titleCheck.value,
        description: descriptionCheck.value,
        budget: parsedBudget,
        category: categoryCheck.value,
        location: locationCheck.value,
        desiredDate: desired.date,
        desiredSlotStart: desired.slotStart,
        desiredSlotEnd: desired.slotEnd,
        clientId: user.userId,
      },
    });

    return NextResponse.json(
      { message: "Demande publiée avec succès", request },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/requests]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
