import { parse } from "url";
import { NextRequest, NextResponse } from "next/server";
import {
  csrfTokensMatch,
  shouldEnforceCsrf,
} from "@/lib/csrf";
import {
  isUploadApiPath,
  maxBodyBytesForPath,
  MAX_UPLOAD_BODY_BYTES,
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

/**
 * Reject oversized API bodies. For upload paths, also reject when
 * Content-Length is missing (otherwise chunked uploads bypass the guard).
 */
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

  const contentLengthRaw = getHeader(headers, "content-length");
  const maxBytes = maxBodyBytesForPath(pathname);
  const isUpload = isUploadApiPath(pathname);

  if (isUpload) {
    if (contentLengthRaw == null || contentLengthRaw === "") {
      return true;
    }
    const contentLength = parseInt(contentLengthRaw, 10);
    if (!Number.isFinite(contentLength) || contentLength <= 0) {
      return true;
    }
    return contentLength > maxBytes;
  }

  const contentLength = parseInt(contentLengthRaw ?? "0", 10);
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    return false;
  }

  return contentLength > maxBytes;
}

/**
 * Validate Content-Length before calling formData() in upload handlers.
 * Returns a 413 response when missing or over the upload ceiling.
 */
export function rejectInvalidUploadContentLength(
  req: NextRequest,
  maxBytes: number = MAX_UPLOAD_BODY_BYTES
): NextResponse | null {
  const raw = req.headers.get("content-length");
  if (raw == null || raw === "") {
    logSecurityEvent({
      event: "request.body_too_large",
      detail: "missing Content-Length on upload",
    });
    return NextResponse.json(
      { error: PAYLOAD_TOO_LARGE_MESSAGE },
      { status: 413 }
    );
  }

  const contentLength = parseInt(raw, 10);
  if (
    !Number.isFinite(contentLength) ||
    contentLength <= 0 ||
    contentLength > maxBytes
  ) {
    logSecurityEvent({
      event: "request.body_too_large",
      detail: "Content-Length over upload limit or invalid",
      meta: { contentLength: raw, maxBytes },
    });
    return NextResponse.json(
      { error: PAYLOAD_TOO_LARGE_MESSAGE },
      { status: 413 }
    );
  }

  return null;
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
