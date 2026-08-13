import { NextResponse } from "next/server";
import { requireAuthOrThrow, requireRole } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import { listEligibleServiceBookingsForProvider } from "@/lib/rental/service-booking";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  "GET /api/rental/eligible-service-bookings",
  async (req) => {
    const user = await requireAuthOrThrow(req);
    requireRole(
      user,
      "PROVIDER",
      "Seuls les prestataires peuvent louer du matériel"
    );

    const bookings = await listEligibleServiceBookingsForProvider(user.userId);
    return NextResponse.json({ bookings });
  }
);
