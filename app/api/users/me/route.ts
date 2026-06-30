import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

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
    const detail =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : undefined;
    return NextResponse.json(
      { error: "Erreur serveur", ...(detail && { detail }) },
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

    if (name !== undefined && !String(name).trim()) {
      return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(phone !== undefined && { phone: phone ? String(phone).trim() : null }),
        ...(bio !== undefined && { bio: bio ? String(bio).trim() : null }),
      },
      select: userSelect,
    });

    return NextResponse.json({ message: "Profil mis à jour", user });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
