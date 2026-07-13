import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { buildAvatarApiPath } from "@/lib/avatar";
import {
  deleteAvatarFiles,
  saveAvatarFile,
  validateAvatarUploadFile,
} from "@/lib/avatar-storage";
import { withApiHandler } from "@/lib/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler("POST /api/users/me/avatar", async (req) => {
  const auth = await requireAuthOrThrow(req);

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
});

export const DELETE = withApiHandler("DELETE /api/users/me/avatar", async (req) => {
  const auth = await requireAuthOrThrow(req);

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
});
