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

// ── UI labels / filters (source of truth for dashboards & cards) ───────────────

export type BookingViewer = "client" | "provider";

/** Libellés courts (client / badge générique). */
export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  PAID: "Payé",
  IN_PROGRESS: "En cours",
  DONE_PENDING_VALIDATION: "À valider",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

/** Libellés contextuels côté prestataire. */
export const BOOKING_STATUS_LABEL_PROVIDER: Record<BookingStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé — en attente de paiement",
  PAID: "Payé — à démarrer",
  IN_PROGRESS: "En cours",
  DONE_PENDING_VALIDATION: "Terminée — en attente de validation client",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

/** Libellés contextuels côté client (carte). */
export const BOOKING_STATUS_LABEL_CLIENT: Record<BookingStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  PAID: "Payé — en attente de démarrage",
  IN_PROGRESS: "En cours",
  DONE_PENDING_VALIDATION: "Terminée — à valider",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

export function bookingStatusLabel(
  status: BookingStatus,
  viewer: BookingViewer = "client"
): string {
  if (viewer === "provider") return BOOKING_STATUS_LABEL_PROVIDER[status];
  return BOOKING_STATUS_LABEL_CLIENT[status];
}

export const BOOKING_STATUS_CLASS: Record<BookingStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PAID: "bg-brand-50 text-brand-700 border-brand-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  DONE_PENDING_VALIDATION: "bg-amber-50 text-amber-800 border-amber-200",
  COMPLETED: "bg-brand-50 text-brand-700 border-brand-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

export const PAYMENT_STATUS_LABEL: Partial<Record<TransactionStatus, string>> = {
  ESCROWED: "Paiement sécurisé (séquestre)",
  RELEASED: "Versement au prestataire déclenché",
  SUCCESS: "Paiement sécurisé (séquestre)",
  REFUNDED: "Remboursé",
  FAILED: "Paiement échoué",
  PENDING: "Paiement en attente",
};

export const PAYMENT_STATUS_LABEL_PROVIDER: Partial<
  Record<TransactionStatus, string>
> = {
  ESCROWED:
    "Paiement sécurisé (séquestre) — fonds débloqués à la validation client",
  RELEASED: "Fonds versés sur votre compte",
  SUCCESS: "Paiement sécurisé (séquestre)",
  REFUNDED: "Paiement remboursé au client",
  FAILED: "Paiement échoué",
  PENDING: "Paiement en attente",
};

export function paymentStatusLabel(
  status: TransactionStatus,
  viewer: BookingViewer = "client"
): string | undefined {
  if (viewer === "provider") return PAYMENT_STATUS_LABEL_PROVIDER[status];
  return PAYMENT_STATUS_LABEL[status];
}

export const CLIENT_BOOKING_FILTERS: {
  label: string;
  value: BookingStatus | "ALL";
}[] = [
  { label: "Toutes", value: "ALL" },
  { label: "En attente", value: "PENDING" },
  { label: "À payer", value: "CONFIRMED" },
  { label: "Payées", value: "PAID" },
  { label: "En cours", value: "IN_PROGRESS" },
  { label: "À valider", value: "DONE_PENDING_VALIDATION" },
  { label: "Terminées", value: "COMPLETED" },
  { label: "Annulées", value: "CANCELLED" },
];

export const PROVIDER_BOOKING_FILTERS: {
  label: string;
  value: BookingStatus | "ALL";
}[] = [
  { label: "Toutes", value: "ALL" },
  { label: "En attente", value: "PENDING" },
  { label: "À payer", value: "CONFIRMED" },
  { label: "À démarrer", value: "PAID" },
  { label: "En cours", value: "IN_PROGRESS" },
  { label: "À valider", value: "DONE_PENDING_VALIDATION" },
  { label: "Terminées", value: "COMPLETED" },
  { label: "Annulées", value: "CANCELLED" },
];

