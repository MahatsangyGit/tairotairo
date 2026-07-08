export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PAID"
  | "IN_PROGRESS"
  | "DONE_PENDING_VALIDATION"
  | "COMPLETED"
  | "CANCELLED";

const BOOKING_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PAID",
  "IN_PROGRESS",
  "DONE_PENDING_VALIDATION",
  "COMPLETED",
  "CANCELLED",
];

// États considérés comme "terminés" (plus d'action possible côté workflow paiement).
const TERMINAL_STATUSES: BookingStatus[] = ["COMPLETED", "CANCELLED"];

export function normalizeBookingStatus(status: unknown): BookingStatus {
  const value = String(status).toUpperCase();
  if (BOOKING_STATUSES.includes(value as BookingStatus)) {
    return value as BookingStatus;
  }
  return "PENDING";
}

export function isTerminalBookingStatus(status: BookingStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function serializeBooking<T extends { status: unknown }>(booking: T) {
  return { ...booking, status: normalizeBookingStatus(booking.status) };
}

/**
 * Statut affiché : aligne réservation et proposition acceptée terminée.
 * Conservé pour compatibilité ascendante (pages qui ne connaissent que les
 * anciens états PENDING/CONFIRMED/COMPLETED/CANCELLED).
 */
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

// ── Transitions de statut ──────────────────────────────────────────────────────

const PROVIDER_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CANCELLED"],
  PAID: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["DONE_PENDING_VALIDATION", "CANCELLED"],
  DONE_PENDING_VALIDATION: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const CLIENT_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CANCELLED"],
  CONFIRMED: ["CANCELLED"],
  PAID: ["CANCELLED"],
  IN_PROGRESS: ["CANCELLED"],
  // Le client valide la fin de prestation annoncée par le prestataire.
  DONE_PENDING_VALIDATION: ["COMPLETED", "CANCELLED"],
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
  if (isTerminalBookingStatus(current)) return false;

  if (role === "ADMIN") return true;

  if (isProvider && role === "PROVIDER") {
    return PROVIDER_TRANSITIONS[current].includes(next);
  }

  if (isClient && role === "CLIENT") {
    return CLIENT_TRANSITIONS[current].includes(next);
  }

  return false;
}

// ── États de paiement dérivés ──────────────────────────────────────────────────

export type TransactionStatus =
  | "PENDING"
  | "ESCROWED"
  | "RELEASED"
  | "REFUNDED"
  | "FAILED"
  // "SUCCESS" est l'ancien état legacy ; on le normalise vers RELEASED/ESCROWED.
  | "SUCCESS";

/** Vrai si la réservation a été payée via l'app (fonds capturés ou libérés). */
export function isBookingPaidViaApp(transaction?: {
  status?: unknown;
} | null): boolean {
  if (!transaction) return false;
  const status = String(transaction.status).toUpperCase();
  return (
    status === "ESCROWED" ||
    status === "RELEASED" ||
    status === "SUCCESS"
  );
}

/** Vrai si un avis peut être laissé (réservation terminée ET payée via l'app). */
export function canReviewBooking(booking: {
  status: unknown;
  transaction?: { status?: unknown } | null;
}): boolean {
  const status = normalizeBookingStatus(booking.status);
  if (status !== "COMPLETED") return false;
  return isBookingPaidViaApp(booking.transaction);
}
