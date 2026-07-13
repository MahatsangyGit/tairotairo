import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminStats } from "@/lib/admin-stats";

export const dynamic = "force-dynamic";

export const GET = withApiHandler("GET /api/admin/stats", async (req) => {
  const auth = await requireAdmin(req);

  const stats = await getAdminStats();
  return NextResponse.json(stats);
});
