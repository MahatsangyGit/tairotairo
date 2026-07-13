import { NextResponse } from "next/server";
import { requireAuthOrThrow, requireRole } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import { getProviderKycPayload } from "@/lib/provider-kyc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler("GET /api/provider/kyc", async (req) => {
  const auth = await requireAuthOrThrow(req);
  requireRole(auth, ["PROVIDER", "ADMIN"], "Réservé aux prestataires");

  const kyc = await getProviderKycPayload(auth.userId);
  return NextResponse.json({ kyc });
});
