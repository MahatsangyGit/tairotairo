export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

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
