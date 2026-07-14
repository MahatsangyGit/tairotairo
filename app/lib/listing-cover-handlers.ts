import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { JwtPayload } from "@/lib/jwt";
import { throwForbidden, throwNotFound } from "@/lib/api-handler";
import { assertProviderKycApproved } from "@/lib/provider-kyc";
import { assertEmailVerified } from "@/lib/email-verification";
import {
  deleteListingCoverFiles,
  readListingCoverFile,
  saveListingCoverFile,
  validateListingCoverFile,
} from "@/lib/listing-cover-storage";
import { buildListingCoverUrl, type ListingCoverKind } from "@/lib/listing-cover";
import {
  createImageResponse,
  isVersionedImageRequest,
} from "@/lib/image-response";
import { API_RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { rejectInvalidUploadContentLength } from "@/lib/http-security";

async function assertServiceOwnership(
  id: string,
  userId: string,
  role: string
) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throwNotFound("Service introuvable");
  if (service.providerId !== userId && role !== "ADMIN") {
    throwForbidden("Accès refusé");
  }
  return service;
}

async function assertRequestOwnership(
  id: string,
  userId: string,
  role: string
) {
  const request = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!request) throwNotFound("Demande introuvable");
  if (request.clientId !== userId && role !== "ADMIN") {
    throwForbidden("Accès refusé");
  }
  return request;
}

export async function handleListingCoverGet(
  req: NextRequest,
  kind: ListingCoverKind,
  id: string
) {
  if (kind === "service") {
    const service = await prisma.service.findUnique({
      where: { id },
      select: { coverImageMime: true, available: true },
    });

    if (!service?.coverImageMime) {
      throwNotFound("Image introuvable");
    }
  } else {
    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      select: { coverImageMime: true },
    });

    if (!request?.coverImageMime) {
      throwNotFound("Image introuvable");
    }
  }

  const file = await readListingCoverFile(kind, id);
  if (!file) {
    throwNotFound("Image introuvable");
  }

  return createImageResponse(req, file.buffer, file.mime, {
    versioned: isVersionedImageRequest(req),
  });
}

export async function handleListingCoverPost(
  req: NextRequest,
  kind: ListingCoverKind,
  id: string,
  auth: JwtPayload
) {
  const rateLimited = await enforceRateLimit(
    req,
    "upload",
    API_RATE_LIMITS.upload,
    { userId: auth.userId }
  );
  if (rateLimited) return rateLimited;

  const tooLarge = rejectInvalidUploadContentLength(req);
  if (tooLarge) return tooLarge;

  if (kind === "service") {
    await assertServiceOwnership(id, auth.userId, auth.role);

    if (auth.role === "PROVIDER") {
      const kycCheck = await assertProviderKycApproved(auth.userId, auth.role);
      if (!kycCheck.ok) {
        return NextResponse.json(
          { error: kycCheck.error },
          { status: kycCheck.status }
        );
      }

      const emailCheck = await assertEmailVerified(auth.userId, auth.role);
      if (!emailCheck.ok) {
        return NextResponse.json(
          { error: emailCheck.error },
          { status: emailCheck.status }
        );
      }
    }
  } else {
    await assertRequestOwnership(id, auth.userId, auth.role);
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image requise" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateListingCoverFile(file, buffer);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  await saveListingCoverFile(kind, id, buffer, validation.mime);

  if (kind === "service") {
    const updated = await prisma.service.update({
      where: { id },
      data: { coverImageMime: validation.mime },
    });

    return NextResponse.json({
      message: "Photo enregistrée",
      coverImageUrl: buildListingCoverUrl("service", id, Date.now()),
      service: updated,
    });
  }

  const updated = await prisma.serviceRequest.update({
    where: { id },
    data: { coverImageMime: validation.mime },
  });

  return NextResponse.json({
    message: "Photo enregistrée",
    coverImageUrl: buildListingCoverUrl("request", id, Date.now()),
    request: updated,
  });
}

export async function handleListingCoverDelete(
  kind: ListingCoverKind,
  id: string,
  auth: JwtPayload
) {
  if (kind === "service") {
    await assertServiceOwnership(id, auth.userId, auth.role);
    await deleteListingCoverFiles("service", id);

    const updated = await prisma.service.update({
      where: { id },
      data: { coverImageMime: null },
    });

    return NextResponse.json({
      message: "Photo supprimée",
      service: updated,
    });
  }

  await assertRequestOwnership(id, auth.userId, auth.role);
  await deleteListingCoverFiles("request", id);

  const updated = await prisma.serviceRequest.update({
    where: { id },
    data: { coverImageMime: null },
  });

  return NextResponse.json({
    message: "Photo supprimée",
    request: updated,
  });
}
