import { describe, expect, it } from "vitest";
import { formatRelativeFr } from "@/lib/datetime-relative";

describe("formatRelativeFr", () => {
  const now = new Date("2026-08-31T12:00:00.000Z");

  it("dit à l’instant sous la minute", () => {
    expect(formatRelativeFr(new Date("2026-08-31T11:59:40.000Z"), now)).toBe(
      "à l’instant"
    );
  });

  it("compte les minutes et les heures", () => {
    expect(formatRelativeFr(new Date("2026-08-31T11:47:00.000Z"), now)).toBe(
      "il y a 13 minutes"
    );
    expect(formatRelativeFr(new Date("2026-08-31T10:00:00.000Z"), now)).toBe(
      "il y a 2 heures"
    );
  });

  it("dit hier pour 24–47 h", () => {
    expect(formatRelativeFr(new Date("2026-08-30T12:00:00.000Z"), now)).toBe(
      "hier"
    );
  });
});
