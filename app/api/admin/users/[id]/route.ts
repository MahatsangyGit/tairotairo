import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  isValidRole,
  setUserRole,
  suspendUser,
  unsuspendUser,
} from "@/lib/admin-users";
import { unlockUserLogin } from "@/lib/login-lockout-admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = requireAdmin(req);
    if (!admin.ok) return admin.response;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action;

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
      const role = body.role;
      if (!role || !isValidRole(role)) {
        return NextResponse.json(
          { error: "Rôle requis : CLIENT, PROVIDER ou ADMIN" },
          { status: 400 }
        );
      }

      const result = await setUserRole(id, admin.auth.userId, role);
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
