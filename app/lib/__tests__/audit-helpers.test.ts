import { describe, expect, it } from "vitest";
import { escapeHtml } from "@/lib/html-escape";
import {
  applySlotToDate,
  madagascarDateTime,
  parseDayDate,
  BUSINESS_TIMEZONE,
} from "@/lib/datetime-slot";
import { createRequestId } from "@/lib/request-context";
import { paidReviewWhere } from "@/lib/paid-reviews";

describe("escapeHtml (H12)", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`<script>alert("x")</script>&'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;"
    );
  });
});

describe("datetime Madagascar TZ (M6)", () => {
  it("parses YYYY-MM-DD as midnight in Indian/Antananarivo", () => {
    const d = parseDayDate("2026-07-14");
    expect(d).not.toBeNull();
    expect(d!.toISOString()).toBe(
      madagascarDateTime(2026, 7, 14, 0, 0).toISOString()
    );
  });

  it("applies slot in business timezone not host local", () => {
    const base = parseDayDate("2026-07-14")!;
    const withSlot = applySlotToDate(base, "14:30");
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: BUSINESS_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(withSlot);
    const hour = parts.find((p) => p.type === "hour")?.value;
    const minute = parts.find((p) => p.type === "minute")?.value;
    expect(`${hour}:${minute}`).toBe("14:30");
  });
});

describe("request id (H10)", () => {
  it("accepts a valid incoming id", () => {
    expect(createRequestId("abc-123_def.xyz")).toBe("abc-123_def.xyz");
  });

  it("generates a uuid when missing", () => {
    expect(createRequestId(null)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});

describe("paidReviewWhere (M2)", () => {
  it("filters by ESCROWED or RELEASED transaction", () => {
    const where = paidReviewWhere("provider1");
    expect(where.targetId).toBe("provider1");
    expect(where.booking).toEqual({
      is: {
        transaction: {
          is: { status: { in: ["ESCROWED", "RELEASED"] } },
        },
      },
    });
  });
});
