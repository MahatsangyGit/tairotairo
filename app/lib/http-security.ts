import { parse } from "url";
import {
  csrfTokensMatch,
  shouldEnforceCsrf,
} from "@/lib/csrf";
import {
  MAX_API_BODY_BYTES,
  PAYLOAD_TOO_LARGE_MESSAGE,
} from "@/lib/request-limits";
import { logSecurityEvent } from "@/lib/security-audit";

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) continue;
    cookies[rawKey] = decodeURIComponent(rest.join("="));
  }

  return cookies;
}

function getHeader(
  headers: NodeJS.Dict<string | string[] | undefined>,
  name: string
): string | undefined {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

export function rejectOversizedApiBody(
  method: string | undefined,
  url: string | undefined,
  headers: NodeJS.Dict<string | string[] | undefined>
): boolean {
  if (!url || !method || method === "GET" || method === "HEAD") {
    return false;
  }

  const pathname = parse(url, true).pathname ?? "";
  if (!pathname.startsWith("/api")) {
    return false;
  }

  const contentLength = parseInt(getHeader(headers, "content-length") ?? "0", 10);
  return contentLength > MAX_API_BODY_BYTES;
}

export function rejectInvalidCsrf(
  method: string | undefined,
  url: string | undefined,
  headers: NodeJS.Dict<string | string[] | undefined>
): boolean {
  if (!url || !method) return false;

  const pathname = parse(url, true).pathname ?? "";
  if (!shouldEnforceCsrf(method, pathname)) {
    return false;
  }

  const cookies = parseCookieHeader(getHeader(headers, "cookie"));
  const cookieToken = cookies["csrf-token"];
  const headerToken = getHeader(headers, "x-csrf-token");

  if (csrfTokensMatch(cookieToken, headerToken)) {
    return false;
  }

  logSecurityEvent({
    event: "auth.csrf_rejected",
    path: pathname,
    detail: "CSRF token mismatch or missing",
  });

  return true;
}

export function writeJsonError(
  res: import("http").ServerResponse,
  status: number,
  error: string
): void {
  const body = JSON.stringify({ error });
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

export function payloadTooLargeResponse(
  res: import("http").ServerResponse
): void {
  logSecurityEvent({ event: "request.body_too_large" });
  writeJsonError(res, 413, PAYLOAD_TOO_LARGE_MESSAGE);
}

export function csrfRejectedResponse(
  res: import("http").ServerResponse
): void {
  writeJsonError(res, 403, "Requête invalide");
}
