import { z } from "zod";
import { NextResponse } from "next/server";
import { MAX_API_BODY_BYTES } from "@/lib/request-limits";
import { PAYLOAD_TOO_LARGE_MESSAGE } from "@/lib/request-limits";

export async function parseJsonBody(
  req: Request
): Promise<
  { ok: true; body: unknown } | { ok: false; response: NextResponse }
> {
  try {
    const raw = await req.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_API_BODY_BYTES) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: PAYLOAD_TOO_LARGE_MESSAGE },
          { status: 413 }
        ),
      };
    }
    if (!raw.trim()) {
      return { ok: true, body: {} };
    }
    return { ok: true, body: JSON.parse(raw) };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Corps JSON invalide" },
        { status: 400 }
      ),
    };
  }
}

export function parseBody<T extends z.ZodType>(
  schema: T,
  body: unknown
): { ok: true; data: z.infer<T> } | { ok: false; response: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      ok: false,
      response: NextResponse.json(
        { error: issue?.message ?? "Données invalides" },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: result.data };
}
