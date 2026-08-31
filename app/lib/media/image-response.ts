import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { imageResponseHeaders } from "@/lib/cache";

function buildEtag(buffer: Buffer): string {
  return `"${createHash("sha1").update(buffer).digest("hex").slice(0, 16)}"`;
}

export function createImageResponse(
  req: NextRequest,
  buffer: Buffer,
  mime: string,
  options?: { versioned?: boolean }
): NextResponse {
  const etag = buildEtag(buffer);
  const ifNoneMatch = req.headers.get("if-none-match");

  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: imageResponseHeaders(mime, {
        versioned: options?.versioned,
        etag,
      }),
    });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: imageResponseHeaders(mime, {
      versioned: options?.versioned,
      etag,
    }),
  });
}

export function isVersionedImageRequest(req: NextRequest): boolean {
  return req.nextUrl.searchParams.has("v");
}
