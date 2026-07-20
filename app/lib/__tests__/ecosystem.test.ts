import { describe, expect, it } from "vitest";
import {
  canTransitionRental,
  computeRentalTotalAmount,
  rentalActorForUser,
} from "@/lib/rental/status";
import { isSubscriptionActive } from "@/lib/subscription";
import {
  absoluteVerticalUrl,
  getAllowedHostnames,
  resolveVerticalFromHost,
} from "@/lib/origins";

describe("rental status machine", () => {
  it("allows owner to accept a request", () => {
    expect(canTransitionRental("REQUESTED", "ACCEPTED", "owner")).toBe(true);
  });

  it("forbids renter from accepting", () => {
    expect(canTransitionRental("REQUESTED", "ACCEPTED", "renter")).toBe(false);
  });

  it("forbids skipping payment to ongoing", () => {
    expect(canTransitionRental("ACCEPTED", "ONGOING", "owner")).toBe(false);
  });

  it("allows admin to settle disputes", () => {
    expect(canTransitionRental("DISPUTED", "COMPLETED", "admin")).toBe(true);
    expect(canTransitionRental("DISPUTED", "COMPLETED", "owner")).toBe(false);
  });

  it("resolves actor roles", () => {
    expect(
      rentalActorForUser({
        userId: "a",
        role: "CLIENT",
        renterId: "a",
        ownerId: "b",
      })
    ).toBe("renter");
    expect(
      rentalActorForUser({
        userId: "b",
        role: "PROVIDER",
        renterId: "a",
        ownerId: "b",
      })
    ).toBe("owner");
    expect(
      rentalActorForUser({
        userId: "x",
        role: "ADMIN",
        renterId: "a",
        ownerId: "b",
      })
    ).toBe("admin");
  });
});

describe("rental amount calculation", () => {
  it("charges at least one day", () => {
    const start = new Date("2026-07-20T08:00:00Z");
    const end = new Date("2026-07-20T18:00:00Z");
    expect(computeRentalTotalAmount(10000, start, end)).toBe(10000);
  });

  it("rounds up partial days", () => {
    const start = new Date("2026-07-20T08:00:00Z");
    const end = new Date("2026-07-22T10:00:00Z");
    expect(computeRentalTotalAmount(10000, start, end)).toBe(30000);
  });
});

describe("subscription gating for learning", () => {
  it("isSubscriptionActive gates video access", () => {
    expect(isSubscriptionActive(new Date(Date.now() + 60_000))).toBe(true);
    expect(isSubscriptionActive(new Date(Date.now() - 60_000))).toBe(false);
    expect(isSubscriptionActive(null)).toBe(false);
  });
});

describe("origins multi-host", () => {
  it("defaults to marketplace without hosts", () => {
    expect(resolveVerticalFromHost("localhost:3000")).toBe("marketplace");
  });

  it("builds absolute rental path without dedicated host", () => {
    const url = absoluteVerticalUrl("rental", "/materiel/abc");
    expect(url).toContain("/ampindramo/materiel/abc");
  });

  it("lists allowed hostnames from env safely", () => {
    expect(Array.isArray(getAllowedHostnames())).toBe(true);
  });
});
