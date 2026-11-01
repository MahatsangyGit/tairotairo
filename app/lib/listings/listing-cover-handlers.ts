import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { JwtPayload } from "@/lib/auth/jwt";
import { requireEmailVerified } from "@/lib/auth";
import { throwForbidden, throwNotFound, throwUnlessOk } from "@/lib/api-handler";
import { assertProviderKycApproved } from "@/lib/kyc/provider-kyc";
import {
  deleteListingCoverFiles,
  readListingCoverFile,
  saveListingCoverFile,
  validateListingCoverFile,
} from "@/lib/listings/listing-cover-storage";
import { buildListingCoverUrl, type ListingCoverKind } from "@/lib/listings/listing-cover";
import {
  createImageResponse,
  isVersionedImageRequest,
} from "@/lib/media/image-response";
import { API_RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { rejectInvalidUploadContentLength } from "@/lib/http-security";

async function assertListingOwnership(
  kind: ListingCoverKind,
  id: string,
  userId: string,
  role: string
) {
  if (kind === "service") {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) throwNotFound("Service introuvable");
    if (service.providerId !== userId && role !== "ADMIN") {
      throwForbidden("Accès refusé");
    }
    return;
  }
  const request = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!request) throwNotFound("Demande introuvable");
  if (request.clientId !== userId && role !== "ADMIN") {
    throwForbidden("Accès refusé");
  }
}

async function updateCoverMime(
  kind: ListingCoverKind,
  id: string,
  coverImageMime: string | null
) {
  if (kind === "service") {
    return {
      service: await prisma.service.update({
        where: { id },
        data: { coverImageMime },
      }),
    };
  }
  return {
    request: await prisma.serviceRequest.update({
      where: { id },
      data: { coverImageMime },
    }),
  };
}

export async function handleListingCoverGet(
  req: NextRequest,
  kind: ListingCoverKind,
  id: string
) {
  const row =
    kind === "service"
      ? await prisma.service.findUnique({
          where: { id },
          select: { coverImageMime: true },
        })
      : await prisma.serviceRequest.findUnique({
          where: { id },
          select: { coverImageMime: true },
        });

  if (!row?.coverImageMime) throwNotFound("Image introuvable");

  const file = await readListingCoverFile(kind, id);
  if (!file) throwNotFound("Image introuvable");

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

  await assertListingOwnership(kind, id, auth.userId, auth.role);
  if (kind === "service" && auth.role === "PROVIDER") {
    throwUnlessOk(await assertProviderKycApproved(auth.userId, auth.role));
    await requireEmailVerified(auth);
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

  await saveListingCoverFile(kind, id, buffer);
  const updated = await updateCoverMime(kind, id, validation.mime);

  return NextResponse.json({
    message: "Photo enregistrée",
    coverImageUrl: buildListingCoverUrl(kind, id, Date.now()),
    ...updated,
  });
}

export async function handleListingCoverDelete(
  kind: ListingCoverKind,
  id: string,
  auth: JwtPayload
) {
  await assertListingOwnership(kind, id, auth.userId, auth.role);
  await deleteListingCoverFiles(kind, id);
  const updated = await updateCoverMime(kind, id, null);

  return NextResponse.json({
    message: "Photo supprimée",
    ...updated,
  });
}
