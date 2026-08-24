"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBookingDisplayInfo } from "@/lib/booking-display";
import { formatSchedule } from "@/lib/datetime-slot";
import OpenBookingChatButton from "@/components/messages/OpenBookingChatButton";
import { MapPinIcon } from "@/components/ui/app-icons";
import {
  type BookingStatus,
  type TransactionStatus,
  BOOKING_STATUS_CLASS,
  bookingStatusLabel,
  paymentStatusLabel,
} from "@/lib/booking-status";
import ServiceCommissionHint from "@/components/economy/ServiceCommissionHint";

export interface BookingCardData {
  id: string;
  status: BookingStatus;
  date: string | null;
  slotStart?: string | null;
  slotEnd?: string | null;
  service: {
    id: string;
    title: string;
    price: number;
    category: string;
    location: string;
  } | null;
  requestResponse: {
    proposedPrice: number | null;
    request: {
      id: string;
      title: string;
      budget: number;
      category: string;
      location: string;
    } | null;
  } | null;
  displayTitle?: string | null;
  displayPrice?: number | null;
  displayCategory?: string | null;
  displayLocation?: string | null;
  displaySource?: string | null;
  displayTargetId?: string | null;
  commissionRate?: number | null;
  commissionAmount?: number | null;
  provider?: { name: string; phone: string | null };
  client?: { name: string; phone: string | null; email?: string };
  transaction?: {
    id: string;
    amount: number;
    status: TransactionStatus;
    paymentMethod?: string;
  } | null;
}

interface BookingCardProps {
  booking: BookingCardData;
  counterpartyLabel: "Prestataire" | "Client";
  onCancel?: (id: string) => void;
  cancellingId?: string | null;
  /** Client : payer la réservation (statut CONFIRMED). */
  onPay?: (id: string) => void;
  /** Client : valider la fin de prestation (statut DONE_PENDING_VALIDATION). */
  onValidate?: (id: string) => void;
  /** Client : définir / modifier la date de prestation. */
  onScheduleChange?: (
    id: string,
    schedule: { date: string; slotStart?: string | null; slotEnd?: string | null }
  ) => Promise<void> | void;
  busyId?: string | null;
  /** Prestataire : changer le statut de la réservation. */
  onStatusChange?: (id: string, status: BookingStatus) => void;
  updatingId?: string | null;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function BookingCard({
  booking,
  counterpartyLabel,
  onCancel,
  cancellingId,
  onPay,
  onValidate,
  onScheduleChange,
  busyId,
  onStatusChange,
  updatingId,
}: BookingCardProps) {
  const viewer =
    counterpartyLabel === "Prestataire" ? ("client" as const) : ("provider" as const);
  const display = getBookingDisplayInfo(booking, { viewer });

  const dateLabel = formatSchedule(
    booking.date,
    booking.slotStart,
    booking.slotEnd
  );

  const [editingSchedule, setEditingSchedule] = useState(false);
  const [draftDate, setDraftDate] = useState(toDateInputValue(booking.date));
  const [draftSlotStart, setDraftSlotStart] = useState(booking.slotStart ?? "");
  const [draftSlotEnd, setDraftSlotEnd] = useState(booking.slotEnd ?? "");

  useEffect(() => {
    setDraftDate(toDateInputValue(booking.date));
    setDraftSlotStart(booking.slotStart ?? "");
    setDraftSlotEnd(booking.slotEnd ?? "");
  }, [booking.date, booking.slotStart, booking.slotEnd]);

  const counterparty =
    counterpartyLabel === "Prestataire" ? booking.provider : booking.client;

  const categoryClass =
    display.source === "request"
      ? "bg-amber-50 text-amber-800"
      : "bg-brand-50 text-brand-700";

  const isBusy = busyId === booking.id;
  const isUpdating = updatingId === booking.id;
  const canCancel =
    booking.status === "PENDING" ||
    booking.status === "CONFIRMED" ||
    booking.status === "PAID" ||
    booking.status === "IN_PROGRESS" ||
    booking.status === "DONE_PENDING_VALIDATION";

  const canEditSchedule =
    viewer === "client" &&
    !!onScheduleChange &&
    booking.status !== "COMPLETED" &&
    booking.status !== "CANCELLED";

  const needsDate = canEditSchedule && !booking.date;

  const saveSchedule = async () => {
    if (!onScheduleChange || !draftDate) return;
    await onScheduleChange(booking.id, {
      date: draftDate,
      slotStart: draftSlotStart || null,
      slotEnd: draftSlotEnd || null,
    });
    setEditingSchedule(false);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${categoryClass}`}
            >
              {display.category}
            </span>
            {display.source === "request" && (
              <span className="text-xs text-muted-foreground font-medium">
                {display.archived ? "Demande supprimée" : "Via demande"}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-foreground">{display.title}</h3>
          <p className="text-muted-foreground text-sm mt-0.5"><MapPinIcon /> {display.location}</p>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${BOOKING_STATUS_CLASS[booking.status]}`}
        >
          {bookingStatusLabel(booking.status, viewer)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-border mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Date prévue</p>
          <p
            className={`text-sm font-medium ${
              booking.date ? "text-foreground" : "text-amber-700"
            }`}
          >
            {dateLabel}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Prix</p>
          <p className="text-sm font-semibold text-brand-600">
            {display.price.toLocaleString("fr-MG")} Ar
          </p>
        </div>
        {viewer === "provider" && (
          <div className="col-span-2">
            <ServiceCommissionHint
              category={display.category}
              price={display.price}
              frozenRate={
                typeof booking.commissionRate === "number"
                  ? booking.commissionRate
                  : undefined
              }
              tariffLabel="Prix convenu"
            />
          </div>
        )}
        {counterparty && (
          <>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{counterpartyLabel}</p>
              <p className="text-sm font-medium text-foreground">{counterparty.name}</p>
            </div>
            {counterparty.phone && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {viewer === "provider" ? "Téléphone" : "Contact"}
                </p>
                <a
                  href={`tel:${counterparty.phone}`}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  {counterparty.phone}
                </a>
              </div>
            )}
            {viewer === "provider" && booking.client?.email && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <a
                  href={`mailto:${booking.client.email}`}
                  className="text-sm font-medium text-foreground hover:text-brand-600"
                >
                  {booking.client.email}
                </a>
              </div>
            )}
          </>
        )}
      </div>

      {canEditSchedule && (needsDate || editingSchedule) && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-3">
          <p className="text-xs font-medium text-amber-900">
            {needsDate
              ? "Aucune date prévue — choisissez quand la prestation aura lieu."
              : "Modifier la date de prestation"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label htmlFor={`booking-date-${booking.id}`} className="sr-only">
                Date
              </label>
              <input
                id={`booking-date-${booking.id}`}
                type="date"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
              />
            </div>
            <div>
              <label htmlFor={`booking-start-${booking.id}`} className="sr-only">
                Début
              </label>
              <input
                id={`booking-start-${booking.id}`}
                type="time"
                value={draftSlotStart}
                onChange={(e) => setDraftSlotStart(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
              />
            </div>
            <div>
              <label htmlFor={`booking-end-${booking.id}`} className="sr-only">
                Fin
              </label>
              <input
                id={`booking-end-${booking.id}`}
                type="time"
                value={draftSlotEnd}
                onChange={(e) => setDraftSlotEnd(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveSchedule}
              disabled={isBusy || !draftDate}
              className="text-sm bg-brand-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {isBusy ? "..." : "Enregistrer la date"}
            </button>
            {editingSchedule && booking.date && (
              <button
                type="button"
                onClick={() => setEditingSchedule(false)}
                className="text-sm text-muted-foreground px-3 py-1.5"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      )}

      {booking.transaction &&
        paymentStatusLabel(booking.transaction.status, viewer) && (
        <p className="text-xs text-muted-foreground mb-3">
          {paymentStatusLabel(booking.transaction.status, viewer)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {booking.status !== "CANCELLED" && (
          <OpenBookingChatButton bookingId={booking.id} />
        )}
        {onStatusChange && viewer === "provider" && booking.status === "PENDING" && (
          <>
            <button
              type="button"
              onClick={() => onStatusChange(booking.id, "CONFIRMED")}
              disabled={isUpdating}
              className="text-sm bg-brand-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? "..." : "Confirmer"}
            </button>
            <button
              type="button"
              onClick={() => onStatusChange(booking.id, "CANCELLED")}
              disabled={isUpdating}
              className="text-sm text-red-600 font-medium border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Refuser
            </button>
          </>
        )}
        {onStatusChange && viewer === "provider" && booking.status === "CONFIRMED" && (
          <p className="text-xs text-muted-foreground">
            En attente du paiement du client. Vous serez notifié dès réception.
          </p>
        )}
        {onStatusChange && viewer === "provider" && booking.status === "PAID" && (
          <>
            <button
              type="button"
              onClick={() => onStatusChange(booking.id, "IN_PROGRESS")}
              disabled={isUpdating}
              className="text-sm bg-brand-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? "..." : "Démarrer la prestation"}
            </button>
            <button
              type="button"
              onClick={() => onStatusChange(booking.id, "CANCELLED")}
              disabled={isUpdating}
              className="text-sm text-red-600 font-medium border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Annuler
            </button>
          </>
        )}
        {onStatusChange && viewer === "provider" && booking.status === "IN_PROGRESS" && (
          <>
            <button
              type="button"
              onClick={() => onStatusChange(booking.id, "DONE_PENDING_VALIDATION")}
              disabled={isUpdating}
              className="text-sm bg-brand-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? "..." : "Marquer terminé"}
            </button>
            <button
              type="button"
              onClick={() => onStatusChange(booking.id, "CANCELLED")}
              disabled={isUpdating}
              className="text-sm text-red-600 font-medium border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Annuler
            </button>
          </>
        )}
        {onStatusChange && viewer === "provider" && booking.status === "DONE_PENDING_VALIDATION" && (
          <p className="text-xs text-amber-700">
            Prestation terminée de votre côté. Le versement sera déclenché après
            validation du client.
          </p>
        )}
        {viewer === "client" &&
          booking.status === "COMPLETED" &&
          booking.transaction?.status === "RELEASED" && (
            <a
              href={`/api/bookings/${booking.id}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-brand-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
            >
              Facture (PDF)
            </a>
          )}
        {onStatusChange &&
          viewer === "provider" &&
          booking.status === "COMPLETED" &&
          booking.transaction?.status === "RELEASED" && (
            <a
              href={`/api/bookings/${booking.id}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-brand-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
            >
              Facture (PDF)
            </a>
          )}
        {onPay && booking.status === "CONFIRMED" && (
          <button
            type="button"
            onClick={() => onPay(booking.id)}
            disabled={isBusy}
            className="text-sm bg-brand-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isBusy ? "Traitement..." : "Payer"}
          </button>
        )}
        {onValidate && booking.status === "DONE_PENDING_VALIDATION" && (
          <button
            type="button"
            onClick={() => onValidate(booking.id)}
            disabled={isBusy}
            className="text-sm bg-brand-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isBusy ? "Validation..." : "Valider la prestation"}
          </button>
        )}
        {canEditSchedule && booking.date && !editingSchedule && (
          <button
            type="button"
            onClick={() => setEditingSchedule(true)}
            className="text-sm text-brand-600 font-medium border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
          >
            Modifier la date
          </button>
        )}
        {onCancel && canCancel && viewer === "client" && (
          <button
            type="button"
            onClick={() => onCancel(booking.id)}
            disabled={cancellingId === booking.id}
            className="text-sm text-red-600 font-medium border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {cancellingId === booking.id ? "..." : "Annuler"}
          </button>
        )}
        <Link
          href={display.href}
          className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors ml-auto"
        >
          {display.source === "request"
            ? display.archived
              ? viewer === "provider"
                ? "Historique des propositions →"
                : "Historique →"
              : "Voir la demande →"
            : viewer === "provider"
              ? "Voir l'annonce →"
              : "Voir le service →"}
        </Link>
      </div>
    </div>
  );
}
