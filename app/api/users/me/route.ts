import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  FIELD_LIMITS,
  validateOptionalText,
  validateRequiredText,
} from "@/lib/field-limits";

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

    const { name, phone, bio } = await req.json();

    let nameValue: string | undefined;
    if (name !== undefined) {
      const nameCheck = validateRequiredText(
        name,
        "Nom",
        FIELD_LIMITS.USER_NAME
      );
      if (!nameCheck.ok) {
        return NextResponse.json({ error: nameCheck.error }, { status: 400 });
      }
      nameValue = nameCheck.value;
    }

    const phoneCheck = validateOptionalText(
      phone,
      "Téléphone",
      FIELD_LIMITS.USER_PHONE
    );
    if (!phoneCheck.ok) {
      return NextResponse.json({ error: phoneCheck.error }, { status: 400 });
    }

    const bioCheck = validateOptionalText(bio, "Bio", FIELD_LIMITS.USER_BIO);
    if (!bioCheck.ok) {
      return NextResponse.json({ error: bioCheck.error }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        ...(nameValue !== undefined && { name: nameValue }),
        ...(phone !== undefined && { phone: phoneCheck.value }),
        ...(bio !== undefined && { bio: bioCheck.value }),
      },
      select: userSelect,
    });

    return NextResponse.json({ message: "Profil mis à jour", user });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
