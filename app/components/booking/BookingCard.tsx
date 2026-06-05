"use client";

import Link from "next/link";
import { getBookingDisplayInfo } from "@/lib/booking-display";
import { formatSchedule } from "@/lib/datetime-slot";
import OpenBookingChatButton from "@/components/messages/OpenBookingChatButton";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

const STATUS_CLASS: Record<BookingStatus, string> = {
  PENDING: "bg-warning-50 text-warning-700 border-warning-500/20",
  CONFIRMED: "bg-brand-50 text-brand-700 border-brand-200",
  COMPLETED: "bg-success-50 text-success-700 border-success-500/20",
  CANCELLED: "bg-error-50 text-error-700 border-red-200",
};

export interface BookingCardData {
  id: string;
  status: BookingStatus;
  date: string;
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
  provider?: { name: string; phone: string | null };
  client?: { name: string; phone: string | null; email?: string };
}

interface BookingCardProps {
  booking: BookingCardData;
  counterpartyLabel: "Prestataire" | "Client";
  onCancel?: (id: string) => void;
  cancellingId?: string | null;
}

export default function BookingCard({
  booking,
  counterpartyLabel,
  onCancel,
  cancellingId,
}: BookingCardProps) {
  const viewer =
    counterpartyLabel === "Prestataire" ? ("client" as const) : ("provider" as const);
  const display = getBookingDisplayInfo(booking, { viewer });

  const date = formatSchedule(
    booking.date,
    booking.slotStart,
    booking.slotEnd
  );

  const counterparty =
    counterpartyLabel === "Prestataire" ? booking.provider : booking.client;

  const categoryClass =
    display.source === "request"
      ? "bg-amber-50 text-amber-800"
      : "bg-brand-50 text-brand-700";

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${categoryClass}`}
            >
              {display.category}
            </span>
            {display.source === "request" && (
              <span className="text-xs text-neutral-500 font-medium">
                {display.archived ? "Demande supprimée" : "Via demande"}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-neutral-900">{display.title}</h3>
          <p className="text-neutral-500 text-sm mt-0.5">📍 {display.location}</p>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${STATUS_CLASS[booking.status]}`}
        >
          {STATUS_LABEL[booking.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-neutral-100 mb-4">
        <div>
          <p className="text-xs text-neutral-400 mb-0.5">Date prévue</p>
          <p className="text-sm font-medium text-neutral-700">{date}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400 mb-0.5">Prix</p>
          <p className="text-sm font-semibold text-brand-600">
            {display.price.toLocaleString("fr-MG")} Ar
          </p>
        </div>
        {counterparty && (
          <>
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">{counterpartyLabel}</p>
              <p className="text-sm font-medium text-neutral-700">{counterparty.name}</p>
            </div>
            {counterparty.phone && (
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">Contact</p>
                <a
                  href={`tel:${counterparty.phone}`}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  {counterparty.phone}
                </a>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {booking.status !== "CANCELLED" && (
          <OpenBookingChatButton bookingId={booking.id} />
        )}
        {onCancel &&
          (booking.status === "PENDING" || booking.status === "CONFIRMED") && (
            <button
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
              ? "Historique →"
              : "Voir la demande →"
            : "Voir le service →"}
        </Link>
      </div>
    </div>
  );
}
