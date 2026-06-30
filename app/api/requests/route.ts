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
import { withCoverImageUrl } from "@/lib/listing-cover";
import { jsonWithPublicCache } from "@/lib/cache";
import {
  createRequestSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";

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

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(createRequestSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const schedule = parseScheduleInput(
      json.body as Record<string, unknown>
    );

    if (schedule.error) {
      return NextResponse.json({ error: schedule.error }, { status: 400 });
    }

    const desired = scheduleFieldsForDb(schedule);
    const { title, description, budget, category, location } = parsed.data;

    const request = await prisma.serviceRequest.create({
      data: {
        title,
        description,
        budget,
        category,
        location,
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
