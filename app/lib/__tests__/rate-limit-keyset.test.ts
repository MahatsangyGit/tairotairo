import { describe, expect, it, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/rate-limit";
import {
  decodeTimeIdCursor,
  encodeTimeIdCursor,
  parsePageLimit,
} from "@/lib/keyset-cursor";

describe("getClientIp", () => {
  const prev = process.env.TRUSTED_PROXY_COUNT;

  afterEach(() => {
    if (prev === undefined) delete process.env.TRUSTED_PROXY_COUNT;
    else process.env.TRUSTED_PROXY_COUNT = prev;
  });

  it("ignores X-Forwarded-For when TRUSTED_PROXY_COUNT is unset", () => {
    delete process.env.TRUSTED_PROXY_COUNT;
    const req = new NextRequest("http://localhost/api", {
      headers: {
        "x-forwarded-for": "1.2.3.4, 10.0.0.1",
        "x-real-ip": "9.9.9.9",
      },
    });
    expect(getClientIp(req)).toBe("9.9.9.9");
  });

  it("uses X-Forwarded-For when TRUSTED_PROXY_COUNT is set", () => {
    process.env.TRUSTED_PROXY_COUNT = "1";
    const req = new NextRequest("http://localhost/api", {
      headers: {
        "x-forwarded-for": "1.2.3.4, 10.0.0.1",
      },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });
});

describe("keyset cursor", () => {
  it("round-trips timestamp+id", () => {
    const at = new Date("2026-07-14T10:00:00.000Z");
    const encoded = encodeTimeIdCursor(at, "cuid123");
    const decoded = decodeTimeIdCursor(encoded);
    expect(decoded?.id).toBe("cuid123");
    expect(decoded?.at.toISOString()).toBe(at.toISOString());
  });

  it("parses page limits with defaults", () => {
    expect(parsePageLimit(null)).toBe(50);
    expect(parsePageLimit("10")).toBe(10);
    expect(parsePageLimit("999")).toBe(100);
    expect(parsePageLimit("0")).toBe(1);
  });
});
