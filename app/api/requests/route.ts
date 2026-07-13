import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow, requireRole } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
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
export const GET = withApiHandler("GET /api/requests", async (req) => {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";

  if (mine) {
    const user = await requireAuthOrThrow(req);
    requireRole(user, ["CLIENT", "ADMIN"], "Réservé aux clients");

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
});

// POST - Publier une demande de service (client)
export const POST = withApiHandler("POST /api/requests", async (req) => {
  const user = await requireAuthOrThrow(req);
  requireRole(
    user,
    ["CLIENT", "ADMIN"],
    "Seuls les clients peuvent publier une demande"
  );

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

  const schedule = parseScheduleInput(json.body as Record<string, unknown>);

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
});
