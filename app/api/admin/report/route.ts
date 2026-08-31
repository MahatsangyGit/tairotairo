import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminSiteReport } from "@/lib/admin-site-report";

export const dynamic = "force-dynamic";

export const GET = withApiHandler("GET /api/admin/report", async (req) => {
  await requireAdmin(req);
  const report = await getAdminSiteReport();
  return NextResponse.json(report);
});
