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
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-3">
      <p className="text-xs font-medium text-amber-900">
        {needsDate
          ? "Aucune date prévue — choisissez quand la prestation aura lieu."
          : "Modifier la date de prestation"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label htmlFor={`booking-date-${bookingId}`} className="sr-only">
            Date
          </label>
          <input
            id={`booking-date-${bookingId}`}
            type="date"
            value={draftDate}
            onChange={(e) => onDraftDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
          />
        </div>
        <div>
          <label htmlFor={`booking-start-${bookingId}`} className="sr-only">
            Début
          </label>
          <input
            id={`booking-start-${bookingId}`}
            type="time"
            value={draftSlotStart}
            onChange={(e) => onDraftSlotStartChange(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
          />
        </div>
        <div>
          <label htmlFor={`booking-end-${bookingId}`} className="sr-only">
            Fin
          </label>
          <input
            id={`booking-end-${bookingId}`}
            type="time"
            value={draftSlotEnd}
            onChange={(e) => onDraftSlotEndChange(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
          />
        </div>
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
  const showInvoice =
    status === "COMPLETED" &&
    transactionStatus === "RELEASED" &&
    (viewer === "client" || (viewer === "provider" && Boolean(onStatusChange)));

  return (
    <div className="flex flex-wrap items-center gap-3">
      {status !== "CANCELLED" && <OpenBookingChatButton bookingId={bookingId} />}

      {onStatusChange && viewer === "provider" && status === "PENDING" && (
        <>
          <button
            type="button"
            onClick={() => onStatusChange(bookingId, "CONFIRMED")}
            disabled={isUpdating}
            className="text-sm bg-brand-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isUpdating ? "..." : "Confirmer"}
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(bookingId, "CANCELLED")}
            disabled={isUpdating}
            className="text-sm text-red-600 font-medium border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Refuser
          </button>
        </>
      )}

      {onStatusChange && viewer === "provider" && status === "CONFIRMED" && (
        <p className="text-xs text-muted-foreground">
          En attente du paiement du client. Vous serez notifié dès réception.
        </p>
      )}

      {onStatusChange && viewer === "provider" && status === "PAID" && (
        <>
          <button
            type="button"
            onClick={() => onStatusChange(bookingId, "IN_PROGRESS")}
            disabled={isUpdating}
            className="text-sm bg-brand-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isUpdating ? "..." : "Démarrer la prestation"}
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(bookingId, "CANCELLED")}
            disabled={isUpdating}
            className="text-sm text-red-600 font-medium border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
        </>
      )}

      {onStatusChange && viewer === "provider" && status === "IN_PROGRESS" && (
        <>
          <button
            type="button"
            onClick={() => onStatusChange(bookingId, "DONE_PENDING_VALIDATION")}
            disabled={isUpdating}
            className="text-sm bg-brand-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isUpdating ? "..." : "Marquer terminé"}
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(bookingId, "CANCELLED")}
            disabled={isUpdating}
            className="text-sm text-red-600 font-medium border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
        </>
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
