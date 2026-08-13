import { describe, expect, it } from "vitest";
import { createRentalBookingSchema } from "@/lib/schemas/rental";
import {
  isRentalEligibleBookingStatus,
  RENTAL_ELIGIBLE_BOOKING_STATUSES,
  rentalPeriodFromServiceDate,
} from "@/lib/rental/service-booking-rules";

describe("rental eligible service booking statuses", () => {
  it("accepts confirmed, paid, in progress and finishing", () => {
    expect(RENTAL_ELIGIBLE_BOOKING_STATUSES).toEqual([
      "CONFIRMED",
      "PAID",
      "IN_PROGRESS",
      "DONE_PENDING_VALIDATION",
    ]);
    expect(isRentalEligibleBookingStatus("CONFIRMED")).toBe(true);
    expect(isRentalEligibleBookingStatus("PAID")).toBe(true);
    expect(isRentalEligibleBookingStatus("IN_PROGRESS")).toBe(true);
    expect(isRentalEligibleBookingStatus("DONE_PENDING_VALIDATION")).toBe(true);
  });

  it("rejects pending, completed and cancelled", () => {
    expect(isRentalEligibleBookingStatus("PENDING")).toBe(false);
    expect(isRentalEligibleBookingStatus("COMPLETED")).toBe(false);
    expect(isRentalEligibleBookingStatus("CANCELLED")).toBe(false);
  });
});

describe("rental period follows the service date", () => {
  it("uses the Madagascar calendar day of the prestation", () => {
    const { startDate, endDate } = rentalPeriodFromServiceDate(
      new Date("2026-08-20T08:30:00+03:00")
    );
    expect(startDate.toISOString()).toBe("2026-08-19T21:00:00.000Z");
    expect(endDate.toISOString()).toBe("2026-08-20T21:00:00.000Z");
  });
});

describe("createRentalBookingSchema", () => {
  it("requires a service booking instead of free dates", () => {
    const parsed = createRentalBookingSchema.safeParse({
      equipmentId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      serviceBookingId: "clyyyyyyyyyyyyyyyyyyyyyyyyy",
    });
    expect(parsed.success).toBe(true);

    const withoutBooking = createRentalBookingSchema.safeParse({
      equipmentId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      startDate: "2026-08-20",
      endDate: "2026-08-21",
    });
    expect(withoutBooking.success).toBe(false);
  });
});
