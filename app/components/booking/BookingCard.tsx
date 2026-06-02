"use client";

import Link from "next/link";
import { getBookingDisplayInfo } from "@/lib/booking-display";
import OpenBookingChatButton from "@/components/messages/OpenBookingChatButton";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

const STATUS_CLASS: Record<BookingStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

export interface BookingCardData {
  id: string;
  status: BookingStatus;
  date: string;
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

  const date = new Date(booking.date).toLocaleDateString("fr-MG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const counterparty =
    counterpartyLabel === "Prestataire" ? booking.provider : booking.client;

  const categoryClass =
    display.source === "request"
      ? "bg-amber-50 text-amber-800"
      : "bg-emerald-50 text-emerald-700";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${categoryClass}`}
            >
              {display.category}
            </span>
            {display.source === "request" && (
              <span className="text-xs text-amber-700 font-medium">
                {display.archived ? "Demande supprimée" : "Via demande"}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-800">{display.title}</h3>
          <p className="text-gray-500 text-sm mt-0.5">📍 {display.location}</p>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${STATUS_CLASS[booking.status]}`}
        >
          {STATUS_LABEL[booking.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Date prévue</p>
          <p className="text-sm font-medium text-gray-700">{date}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Prix</p>
          <p className="text-sm font-medium text-emerald-600">
            {display.price.toLocaleString("fr-MG")} Ar
          </p>
        </div>
        {counterparty && (
          <>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{counterpartyLabel}</p>
              <p className="text-sm font-medium text-gray-700">{counterparty.name}</p>
            </div>
            {counterparty.phone && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Contact</p>
                <a
                  href={`tel:${counterparty.phone}`}
                  className="text-sm font-medium text-emerald-600 hover:underline"
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
              className="text-sm text-red-600 font-medium border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              {cancellingId === booking.id ? "..." : "Annuler la réservation"}
            </button>
          )}
        <Link
          href={display.href}
          className="text-sm text-emerald-600 font-medium hover:underline ml-auto"
        >
          {display.source === "request"
            ? display.archived
              ? "Historique des demandes →"
              : "Voir la demande →"
            : "Voir le service →"}
        </Link>
      </div>
    </div>
  );
}
