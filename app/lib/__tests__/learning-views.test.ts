import { describe, expect, it } from "vitest";
import {
  fillDailySeries,
  shouldCountLessonView,
  utcDayKey,
} from "@/lib/learning/views";
import { liveChartsMax } from "@/lib/charts/livecharts-model";

describe("lesson video views", () => {
  it("counts the first view", () => {
    expect(shouldCountLessonView(null)).toBe(true);
  });

  it("respects the cooldown", () => {
    const now = new Date("2026-08-31T12:00:00Z");
    const recent = new Date("2026-08-31T10:00:00Z");
    const old = new Date("2026-08-31T05:00:00Z");
    expect(shouldCountLessonView(recent, now, 6 * 60 * 60 * 1000)).toBe(false);
    expect(shouldCountLessonView(old, now, 6 * 60 * 60 * 1000)).toBe(true);
  });

  it("fills missing days with zeros", () => {
    const from = new Date("2026-08-01T00:00:00Z");
    const to = new Date("2026-08-03T00:00:00Z");
    const series = fillDailySeries(from, to, [
      { day: "2026-08-02", count: 4 },
    ]);
    expect(series.labels).toEqual([
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
    ]);
    expect(series.values).toEqual([0, 4, 0]);
  });

  it("keys UTC days", () => {
    expect(utcDayKey(new Date("2026-08-31T23:30:00Z"))).toBe("2026-08-31");
  });
});

describe("livecharts cartesian model", () => {
  it("takes the max across series (LiveCharts2 Values)", () => {
    expect(
      liveChartsMax([
        { type: "line", name: "a", values: [1, 3], color: "#000" },
        { type: "column", name: "b", values: [2, 8], color: "#000" },
      ])
    ).toBe(8);
  });
});
