import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import {
  parseBody,
  parseJsonBody,
  patchUserProfileSchema,
} from "@/lib/api-schemas";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import { isProfessionalClient } from "@/lib/client-kind";
import { MG_PHONE_DUPLICATE, MG_PHONE_REQUIRED } from "@/lib/phone";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  avatar: true,
  bio: true,
  nif: true,
  stat: true,
  rcs: true,
  clientKind: true,
  companyName: true,
  companyAddress: true,
  emailVerified: true,
  emailVerifiedAt: true,
  notifyEmail: true,
  notifyPush: true,
  createdAt: true,
};

// GET - Profil complet
export const GET = withApiHandler("GET /api/users/me", async (req) => {
  const auth = await requireAuthOrThrow(req);

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: userSelect,
  });

  if (!user) {
    throwNotFound("Utilisateur introuvable");
  }

  return NextResponse.json({ user });
});

// PATCH - Mettre à jour le profil
export const PATCH = withApiHandler("PATCH /api/users/me", async (req) => {
  const auth = await requireAuthOrThrow(req);

  const json = await parseJsonBody(req);
  if (!json.ok) return json.response;

  const parsed = parseBody(patchUserProfileSchema, json.body);
  if (!parsed.ok) return parsed.response;

  const current = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true, clientKind: true },
  });

  if (!current) {
    throwNotFound("Utilisateur introuvable");
  }

  const {
    name,
    phone,
    bio,
    nif,
    stat,
    rcs,
    companyName,
    companyAddress,
  } = parsed.data;
  const professional = isProfessionalClient(current);
  const canEditLegal =
    professional || auth.role === "PROVIDER" || auth.role === "ADMIN";

  if (phone === null) {
    return NextResponse.json({ error: MG_PHONE_REQUIRED }, { status: 400 });
  }

  if (phone) {
    const taken = await prisma.user.findFirst({
      where: { phone, id: { not: auth.userId } },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.json({ error: MG_PHONE_DUPLICATE }, { status: 400 });
    }
  }

  if (
    professional &&
    (nif === null || stat === null || rcs === null || companyAddress === null)
  ) {
    return NextResponse.json(
      { error: "NIF, STAT, RCS et adresse sociale sont obligatoires" },
      { status: 400 }
    );
  }

  const nextCompanyName = professional
    ? companyName ?? name
    : undefined;

  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: {
      ...(name !== undefined && !professional && { name }),
      ...(nextCompanyName !== undefined && {
        name: nextCompanyName,
        companyName: nextCompanyName,
      }),
      ...(phone !== undefined && { phone }),
      ...(bio !== undefined && { bio }),
      ...(canEditLegal && nif !== undefined && { nif }),
      ...(canEditLegal && stat !== undefined && { stat }),
      ...(canEditLegal && rcs !== undefined && { rcs }),
      ...(professional &&
        companyAddress !== undefined && { companyAddress }),
    },
    select: userSelect,
  });

  return NextResponse.json({ message: "Profil mis à jour", user });
});
