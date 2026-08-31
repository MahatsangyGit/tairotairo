import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireAuthOrThrow,
  requireClient,
  requireProvider,
  requireEmailVerified,
} from "@/lib/auth";
import { throwForbidden, throwNotFound, throwUnlessOk } from "@/lib/api-handler";
import { assertProviderKycApproved } from "@/lib/provider-kyc";
import { parseListSearchParams } from "@/lib/advanced-search";
import { searchPublicServices } from "@/lib/service-list-search";
import { searchPublicRequests } from "@/lib/request-list-search";
import {
  parseScheduleInput,
  scheduleFieldsForDb,
} from "@/lib/datetime-slot";
import { withCoverImageUrl } from "@/lib/listing-cover";
import { jsonWithPublicCache } from "@/lib/cache";
import { deleteListingCoverFiles } from "@/lib/listing-cover-storage";
import { clearServiceFeaturedIfNeeded } from "@/lib/provider-spotlight";
import { snapshotBookingsForRequest } from "@/lib/booking-snapshot";
import {
  createRequestSchema,
  createServiceSchema,
  parseBody,
  parseJsonBody,
  patchRequestSchema,
  patchServiceSchema,
} from "@/lib/api-schemas";

export async function handleServicesGet(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";

  if (mine) {
    const user = await requireProvider(req, {
      allowAdmin: true,
      message: "Réservé aux prestataires",
    });

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
  return jsonWithPublicCache(await searchPublicServices(params));
}

export async function handleServicesPost(req: NextRequest) {
  const user = await requireProvider(req, {
    message: "Seuls les prestataires peuvent créer un service",
  });
  throwUnlessOk(await assertProviderKycApproved(user.userId, user.role));
  await requireEmailVerified(user);

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
}

export async function handleServicePatch(
  req: NextRequest,
  id: string
) {
  const user = await requireAuthOrThrow(req);

  const json = await parseJsonBody(req);
  if (!json.ok) return json.response;

  const parsed = parseBody(patchServiceSchema, json.body);
  if (!parsed.ok) return parsed.response;

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throwNotFound("Service introuvable");
  if (service.providerId !== user.userId && user.role !== "ADMIN") {
    throwForbidden("Accès refusé");
  }

  if (user.role === "PROVIDER") {
    throwUnlessOk(await assertProviderKycApproved(user.userId, user.role));
    await requireEmailVerified(user);
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

export async function handleServiceDelete(
  req: NextRequest,
  id: string
) {
  const user = await requireAuthOrThrow(req);
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throwNotFound("Service introuvable");
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

export async function handleRequestsGet(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";

  if (mine) {
    const user = await requireClient(req, { message: "Réservé aux clients" });
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
  return jsonWithPublicCache(await searchPublicRequests(params));
}

export async function handleRequestsPost(req: NextRequest) {
  const user = await requireClient(req, {
    verified: true,
    message: "Seuls les clients peuvent publier une demande",
  });

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
}

export async function handleRequestPatch(
  req: NextRequest,
  id: string
) {
  const user = await requireAuthOrThrow(req);

  const json = await parseJsonBody(req);
  if (!json.ok) return json.response;

  const parsed = parseBody(patchRequestSchema, json.body);
  if (!parsed.ok) return parsed.response;

  const existing = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!existing) throwNotFound("Demande introuvable");
  if (existing.clientId !== user.userId && user.role !== "ADMIN") {
    throwForbidden("Accès refusé");
  }

  const {
    title,
    description,
    budget,
    category,
    location,
    open,
    desiredDate,
    desiredSlotStart,
    desiredSlotEnd,
  } = parsed.data;

  let desiredPatch:
    | {
        desiredDate: Date | null;
        desiredSlotStart: string | null;
        desiredSlotEnd: string | null;
      }
    | undefined;

  if (
    desiredDate !== undefined ||
    desiredSlotStart !== undefined ||
    desiredSlotEnd !== undefined
  ) {
    const schedule = parseScheduleInput({
      desiredDate,
      desiredSlotStart,
      desiredSlotEnd,
    });
    if (schedule.error) {
      return NextResponse.json({ error: schedule.error }, { status: 400 });
    }
    const desired = scheduleFieldsForDb(schedule);
    desiredPatch = {
      desiredDate: desired.date,
      desiredSlotStart: desired.slotStart,
      desiredSlotEnd: desired.slotEnd,
    };
  }

  const updated = await prisma.serviceRequest.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(budget !== undefined && { budget }),
      ...(category !== undefined && { category }),
      ...(location !== undefined && { location }),
      ...desiredPatch,
      ...(open !== undefined && { open }),
    },
  });

  return NextResponse.json({
    message: "Demande mise à jour",
    request: withCoverImageUrl("request", updated),
  });
}

export async function handleRequestDelete(
  req: NextRequest,
  id: string
) {
  const user = await requireAuthOrThrow(req);
  const existing = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!existing) throwNotFound("Demande introuvable");
  if (existing.clientId !== user.userId && user.role !== "ADMIN") {
    throwForbidden("Accès refusé");
  }

  await snapshotBookingsForRequest(id);
  await deleteListingCoverFiles("request", id);
  await prisma.serviceRequest.delete({ where: { id } });
  return NextResponse.json({ message: "Demande supprimée" });
}
