import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler("GET /api/auth/me", async (req) => {
  const auth = await requireAuth(req);

  if (!auth) {
    return NextResponse.json(
      { user: null },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
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

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json(
    { user },
    { headers: { "Cache-Control": "private, no-store" } }
  );
});
