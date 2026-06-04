import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { buildAvatarApiPath } from "@/lib/avatar";
import {
  deleteAvatarFiles,
  saveAvatarFile,
  validateAvatarUploadFile,
} from "@/lib/avatar-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image requise" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateAvatarUploadFile(file, buffer);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await saveAvatarFile(auth.userId, buffer, validation.mime);

    const avatar = buildAvatarApiPath(auth.userId, Date.now());

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: { avatar },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        bio: true,
        emailVerified: true,
      },
    });

    return NextResponse.json({
      message: "Photo de profil mise à jour",
      avatar: user.avatar,
      user,
    });
  } catch (error) {
    console.error("[POST /api/users/me/avatar]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await deleteAvatarFiles(auth.userId);

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: { avatar: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        bio: true,
        emailVerified: true,
      },
    });

    return NextResponse.json({
      message: "Photo de profil supprimée",
      user,
    });
  } catch (error) {
    console.error("[DELETE /api/users/me/avatar]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
