import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);

    if (!auth) {
      return NextResponse.json({ user: null });
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
        suspendedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    if (user.suspendedAt) {
      const response = NextResponse.json(
        { user: null, suspended: true },
        { status: 403 }
      );
      response.cookies.delete("token");
      return response;
    }

    const { suspendedAt: _, ...userWithoutSuspended } = user;

    return NextResponse.json({ user: userWithoutSuspended });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
