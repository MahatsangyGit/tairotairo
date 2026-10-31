"use client";

import { useEffect, useState } from "react";
import { getBookingDisplayInfo } from "@/lib/booking/booking-display";
import { formatSchedule } from "@/lib/datetime-slot";
import { MapPinIcon } from "@/components/ui/app-icons";
import {
  type BookingStatus,
  type TransactionStatus,
  BOOKING_STATUS_CLASS,
  bookingStatusLabel,
  paymentStatusLabel,
} from "@/lib/booking/booking-status";
import ServiceCommissionHint from "@/components/economy/ServiceCommissionHint";
import {
  BookingCardActions,
  BookingScheduleEditor,
} from "@/components/booking/BookingCardSections";

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
          <p className="text-muted-foreground text-sm mt-0.5">
            <MapPinIcon /> {display.location}
          </p>
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
        <BookingScheduleEditor
          bookingId={booking.id}
          needsDate={needsDate}
          editingSchedule={editingSchedule}
          hasExistingDate={Boolean(booking.date)}
          draftDate={draftDate}
          draftSlotStart={draftSlotStart}
          draftSlotEnd={draftSlotEnd}
          isBusy={isBusy}
          onDraftDateChange={setDraftDate}
          onDraftSlotStartChange={setDraftSlotStart}
          onDraftSlotEndChange={setDraftSlotEnd}
          onSave={saveSchedule}
          onCancel={() => setEditingSchedule(false)}
        />
      )}

      {booking.transaction &&
        paymentStatusLabel(booking.transaction.status, viewer) && (
          <p className="text-xs text-muted-foreground mb-3">
            {paymentStatusLabel(booking.transaction.status, viewer)}
          </p>
        )}

      <BookingCardActions
        bookingId={booking.id}
        status={booking.status}
        transactionStatus={booking.transaction?.status}
        viewer={viewer}
        displaySource={display.source}
        displayArchived={Boolean(display.archived)}
        displayHref={display.href}
        hasDate={Boolean(booking.date)}
        canEditSchedule={canEditSchedule}
        editingSchedule={editingSchedule}
        canCancel={canCancel}
        isBusy={isBusy}
        isUpdating={isUpdating}
        cancellingId={cancellingId}
        onStatusChange={onStatusChange}
        onPay={onPay}
        onValidate={onValidate}
        onStartEditSchedule={() => setEditingSchedule(true)}
        onCancel={onCancel}
      />
    </div>
  );
}
