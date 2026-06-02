export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

const BOOKING_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

export function normalizeBookingStatus(status: unknown): BookingStatus {
  const value = String(status).toUpperCase();
  if (BOOKING_STATUSES.includes(value as BookingStatus)) {
    return value as BookingStatus;
  }
  return "PENDING";
}

export function serializeBooking<T extends { status: unknown }>(booking: T) {
  return { ...booking, status: normalizeBookingStatus(booking.status) };
}

/** Statut affiché : aligne réservation et proposition acceptée terminée. */
export function effectiveBookingStatus(booking: {
  status: unknown;
  requestResponse?: { status?: unknown } | null;
}): BookingStatus {
  if (String(booking.requestResponse?.status).toUpperCase() === "COMPLETED") {
    return "COMPLETED";
  }
  return normalizeBookingStatus(booking.status);
}

export function prepareBookingForApi<
  T extends {
    status: unknown;
    requestResponse?: { status?: unknown } | null;
  },
>(booking: T) {
  return { ...booking, status: effectiveBookingStatus(booking) };
}

const PROVIDER_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const CLIENT_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CANCELLED"],
  CONFIRMED: ["CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionStatus(
  current: BookingStatus,
  next: BookingStatus,
  role: string,
  isProvider: boolean,
  isClient: boolean
): boolean {
  if (current === next) return false;
  if (current === "COMPLETED" || current === "CANCELLED") return false;

  if (role === "ADMIN") return true;

  if (isProvider && role === "PROVIDER") {
    return PROVIDER_TRANSITIONS[current].includes(next);
  }

  if (isClient && role === "CLIENT") {
    return CLIENT_TRANSITIONS[current].includes(next);
  }

  return false;
}
