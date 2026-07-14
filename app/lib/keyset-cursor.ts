/** Keyset (cursor) pagination helpers for (timestamp, id) pairs. */

export type TimeIdCursor = {
  at: Date;
  id: string;
};

export function encodeTimeIdCursor(at: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ at: at.toISOString(), id }),
    "utf8"
  ).toString("base64url");
}

export function decodeTimeIdCursor(raw: string | null | undefined): TimeIdCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as { at?: unknown; id?: unknown };
    if (typeof parsed.at !== "string" || typeof parsed.id !== "string") {
      return null;
    }
    const at = new Date(parsed.at);
    if (Number.isNaN(at.getTime()) || !parsed.id) return null;
    return { at, id: parsed.id };
  } catch {
    return null;
  }
}

export function parsePageLimit(
  raw: string | null,
  defaults: { default: number; max: number; min?: number } = {
    default: 50,
    max: 100,
  }
): number {
  const min = defaults.min ?? 1;
  const n = parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return defaults.default;
  return Math.min(defaults.max, Math.max(min, n));
}
