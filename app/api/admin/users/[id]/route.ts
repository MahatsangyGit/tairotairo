import { NextRequest, NextResponse } from "next/server";
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;

    const { id } = await params;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(adminUserActionSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { action, role } = parsed.data;

    if (action === "suspend") {
      const result = await suspendUser(id, admin.auth.userId);
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
      const result = await setUserRole(id, admin.auth.userId, role!);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({ message: result.message, role: result.role });
    }

    return NextResponse.json(
      { error: "Action requise : suspend, unsuspend, unlockLogin ou setRole" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[PATCH /api/admin/users/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
