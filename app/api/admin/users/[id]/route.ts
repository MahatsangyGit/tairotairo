import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { requireAdmin } from "@/lib/admin-auth";
import {
  setUserRole,
  suspendUser,
  unsuspendUser,
} from "@/lib/admin-users";
import { unlockUserLogin } from "@/lib/login-lockout-admin";
import {
  adminUserActionSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(
  "PATCH /api/admin/users/[id]",
  async (req, { params }) => {
    const auth = await requireAdmin(req);

    const { id } = await params;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(adminUserActionSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { action, role } = parsed.data;

    if (action === "suspend") {
      const result = await suspendUser(id, auth.userId);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({ message: result.message, suspendedAt: new Date().toISOString() });
    }

    if (action === "unsuspend") {
      const result = await unsuspendUser(id);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({ message: result.message, suspendedAt: null });
    }

    if (action === "unlockLogin") {
      const result = await unlockUserLogin(id);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({
        message: result.message,
        loginLockedAt: null,
        failedLoginAttempts: 0,
      });
    }

    if (action === "setRole") {
      const result = await setUserRole(id, auth.userId, role!);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({ message: result.message, role: result.role });
    }

    return NextResponse.json(
      { error: "Action requise : suspend, unsuspend, unlockLogin ou setRole" },
      { status: 400 }
    );
  }
);
