import { NextRequest, NextResponse } from "next/server";

export function requireCronSecret(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      return { ok: true as const };
    }
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "CRON_SECRET non configuré" },
        { status: 503 }
      ),
    };
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Non autorisé" }, { status: 401 }),
    };
  }

  return { ok: true as const };
}
