import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import {
  parseBody,
  parseJsonBody,
  patchUserProfileSchema,
} from "@/lib/api-schemas";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";

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

  const { name, phone, bio, nif, stat, rcs } = parsed.data;
  const canEditLegal =
    auth.role === "PROVIDER" || auth.role === "ADMIN";

  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(bio !== undefined && { bio }),
      ...(canEditLegal && nif !== undefined && { nif }),
      ...(canEditLegal && stat !== undefined && { stat }),
      ...(canEditLegal && rcs !== undefined && { rcs }),
    },
    select: userSelect,
  });

  return NextResponse.json({ message: "Profil mis à jour", user });
});
