import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getProviderKycPayload } from "@/lib/provider-kyc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (auth.role !== "PROVIDER" && auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Réservé aux prestataires" }, { status: 403 });
    }

    const kyc = await getProviderKycPayload(auth.userId);
    return NextResponse.json({ kyc });
  } catch (error) {
    console.error("[GET /api/provider/kyc]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
