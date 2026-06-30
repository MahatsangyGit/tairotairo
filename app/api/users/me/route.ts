import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  parseBody,
  parseJsonBody,
  patchUserProfileSchema,
} from "@/lib/api-schemas";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  avatar: true,
  bio: true,
  emailVerified: true,
  emailVerifiedAt: true,
  notifyEmail: true,
  notifyPush: true,
  createdAt: true,
};

// GET - Profil complet
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: userSelect,
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[GET /api/users/me]", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour le profil
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(patchUserProfileSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { name, phone, bio } = parsed.data;

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(bio !== undefined && { bio }),
      },
      select: userSelect,
    });

    return NextResponse.json({ message: "Profil mis à jour", user });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
