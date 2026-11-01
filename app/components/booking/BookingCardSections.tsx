"use client";

import Link from "next/link";
import OpenBookingChatButton from "@/components/messages/OpenBookingChatButton";
import type { BookingStatus, TransactionStatus } from "@/lib/booking/booking-status";

export function BookingScheduleEditor({
  bookingId,
  needsDate,
  editingSchedule,
  hasExistingDate,
  draftDate,
  draftSlotStart,
  draftSlotEnd,
  isBusy,
  onDraftDateChange,
  onDraftSlotStartChange,
  onDraftSlotEndChange,
  onSave,
  onCancel,
}: {
  bookingId: string;
  needsDate: boolean;
  editingSchedule: boolean;
  hasExistingDate: boolean;
  draftDate: string;
  draftSlotStart: string;
  draftSlotEnd: string;
  isBusy: boolean;
  onDraftDateChange: (value: string) => void;
  onDraftSlotStartChange: (value: string) => void;
  onDraftSlotEndChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const fields = [
    {
      id: `booking-date-${bookingId}`,
      label: "Date",
      type: "date" as const,
      value: draftDate,
      onChange: onDraftDateChange,
    },
    {
      id: `booking-start-${bookingId}`,
      label: "Début",
      type: "time" as const,
      value: draftSlotStart,
      onChange: onDraftSlotStartChange,
    },
    {
      id: `booking-end-${bookingId}`,
      label: "Fin",
      type: "time" as const,
      value: draftSlotEnd,
      onChange: onDraftSlotEndChange,
    },
  ];

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-3">
      <p className="text-xs font-medium text-amber-900">
        {needsDate
          ? "Aucune date prévue — choisissez quand la prestation aura lieu."
          : "Modifier la date de prestation"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {fields.map((field) => (
          <div key={field.id}>
            <label htmlFor={field.id} className="sr-only">
              {field.label}
            </label>
            <input
              id={field.id}
              type={field.type}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isBusy || !draftDate}
          className="text-sm bg-brand-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {isBusy ? "..." : "Enregistrer la date"}
        </button>
        {editingSchedule && hasExistingDate && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted-foreground px-3 py-1.5"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}

const PROVIDER_PRIMARY_ACTIONS: Partial<
  Record<
    BookingStatus,
    { nextStatus: BookingStatus; primaryLabel: string; cancelLabel: string }
  >
> = {
  PENDING: {
    nextStatus: "CONFIRMED",
    primaryLabel: "Confirmer",
    cancelLabel: "Refuser",
  },
  PAID: {
    nextStatus: "IN_PROGRESS",
    primaryLabel: "Démarrer la prestation",
    cancelLabel: "Annuler",
  },
  IN_PROGRESS: {
    nextStatus: "DONE_PENDING_VALIDATION",
    primaryLabel: "Marquer terminé",
    cancelLabel: "Annuler",
  },
};

export function BookingCardActions({
  bookingId,
  status,
  transactionStatus,
  viewer,
  displaySource,
  displayArchived,
  displayHref,
  hasDate,
  canEditSchedule,
  editingSchedule,
  canCancel,
  isBusy,
  isUpdating,
  cancellingId,
  onStatusChange,
  onPay,
  onValidate,
  onStartEditSchedule,
  onCancel,
}: {
  bookingId: string;
  status: BookingStatus;
  transactionStatus?: TransactionStatus;
  viewer: "client" | "provider";
  displaySource: "service" | "request";
  displayArchived: boolean;
  displayHref: string;
  hasDate: boolean;
  canEditSchedule: boolean;
  editingSchedule: boolean;
  canCancel: boolean;
  isBusy: boolean;
  isUpdating: boolean;
  cancellingId?: string | null;
  onStatusChange?: (id: string, status: BookingStatus) => void;
  onPay?: (id: string) => void;
  onValidate?: (id: string) => void;
  onStartEditSchedule: () => void;
  onCancel?: (id: string) => void;
}) {
  const providerTransition =
    onStatusChange && viewer === "provider"
      ? PROVIDER_PRIMARY_ACTIONS[status]
      : undefined;

  const showInvoice =
    status === "COMPLETED" &&
    transactionStatus === "RELEASED" &&
    (viewer === "client" || (viewer === "provider" && Boolean(onStatusChange)));

  return (
    <div className="flex flex-wrap items-center gap-3">
      {status !== "CANCELLED" && <OpenBookingChatButton bookingId={bookingId} />}

      {onStatusChange && providerTransition && (
        <>
          <button
            type="button"
            onClick={() => onStatusChange(bookingId, providerTransition.nextStatus)}
            disabled={isUpdating}
            className="text-sm bg-brand-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isUpdating ? "..." : providerTransition.primaryLabel}
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(bookingId, "CANCELLED")}
            disabled={isUpdating}
            className="text-sm text-red-600 font-medium border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {providerTransition.cancelLabel}
          </button>
        </>
      )}

      {onStatusChange && viewer === "provider" && status === "CONFIRMED" && (
        <p className="text-xs text-muted-foreground">
          En attente du paiement du client. Vous serez notifié dès réception.
        </p>
      )}

      {onStatusChange &&
        viewer === "provider" &&
        status === "DONE_PENDING_VALIDATION" && (
          <p className="text-xs text-amber-700">
            Prestation terminée de votre côté. Le versement sera déclenché après
            validation du client.
          </p>
        )}

      {showInvoice && (
        <a
          href={`/api/bookings/${bookingId}/invoice`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm bg-brand-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
        >
          Facture (PDF)
        </a>
      )}

      {onPay && status === "CONFIRMED" && (
        <button
          type="button"
          onClick={() => onPay(bookingId)}
          disabled={isBusy}
          className="text-sm bg-brand-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {isBusy ? "Traitement..." : "Payer"}
        </button>
      )}

      {onValidate && status === "DONE_PENDING_VALIDATION" && (
        <button
          type="button"
          onClick={() => onValidate(bookingId)}
          disabled={isBusy}
          className="text-sm bg-brand-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {isBusy ? "Validation..." : "Valider la prestation"}
        </button>
      )}

      {canEditSchedule && hasDate && !editingSchedule && (
        <button
          type="button"
          onClick={onStartEditSchedule}
          className="text-sm text-brand-600 font-medium border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
        >
          Modifier la date
        </button>
      )}

      {onCancel && canCancel && viewer === "client" && (
        <button
          type="button"
          onClick={() => onCancel(bookingId)}
          disabled={cancellingId === bookingId}
          className="text-sm text-red-600 font-medium border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {cancellingId === bookingId ? "..." : "Annuler"}
        </button>
      )}

      <Link
        href={displayHref}
        className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors ml-auto"
      >
        {displaySource === "request"
          ? displayArchived
            ? viewer === "provider"
              ? "Historique des propositions →"
              : "Historique →"
            : "Voir la demande →"
          : viewer === "provider"
            ? "Voir l'annonce →"
            : "Voir le service →"}
      </Link>
    </div>
  );
}
