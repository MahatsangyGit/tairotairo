import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export function requireAdmin(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Non autorisé" }, { status: 401 }),
    };
  }
  if (auth.role !== "ADMIN") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Accès réservé aux administrateurs" }, {
        status: 403,
      }),
    };
  }
  return { ok: true as const, auth };
}
