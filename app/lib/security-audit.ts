import { getClientIp } from "@/lib/rate-limit";

export type SecurityAuditEvent =
  | "auth.login_failed"
  | "auth.login_locked"
  | "auth.login_success"
  | "auth.logout"
  | "auth.register_duplicate"
  | "auth.rate_limited"
  | "auth.otp_failed"
  | "auth.otp_locked"
  | "auth.password_reset"
  | "auth.csrf_rejected"
  | "auth.token_revoked"
  | "admin.user_suspended"
  | "admin.user_unsuspended"
  | "admin.login_unlocked"
  | "request.body_too_large";

interface SecurityAuditPayload {
  event: SecurityAuditEvent;
  ip?: string;
  userId?: string;
  email?: string;
  path?: string;
  detail?: string;
  meta?: Record<string, string | number | boolean | null>;
}

/** Structured JSON security events for log aggregation / SIEM. */
export function logSecurityEvent(payload: SecurityAuditPayload): void {
  const entry = {
    type: "security_audit",
    ts: new Date().toISOString(),
    ...payload,
  };

  console.info(JSON.stringify(entry));
}

export function logSecurityEventFromRequest(
  event: SecurityAuditEvent,
  req: { headers: Headers; url?: string },
  fields: Omit<SecurityAuditPayload, "event" | "ip" | "path"> = {}
): void {
  let path: string | undefined;
  if (req.url) {
    try {
      path = new URL(req.url).pathname;
    } catch {
      path = undefined;
    }
  }

  logSecurityEvent({
    event,
    ip: getClientIp(req as Parameters<typeof getClientIp>[0]),
    path,
    ...fields,
  });
}
