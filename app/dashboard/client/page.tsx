"use client";

import { useState } from "react";
import Link from "next/link";
import BookingCard, { type BookingCardData } from "@/components/booking/BookingCard";
import ReviewForm from "@/components/reviews/ReviewForm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import PaymentDialog from "@/components/booking/PaymentDialog";
import {
  type BookingStatus,
  BOOKING_STATUS_LABEL,
  CLIENT_BOOKING_FILTERS,
  isBookingPaidViaApp,
} from "@/lib/booking-status";
import { apiFetchJson } from "@/lib/api-client";
import { messageFromApiAction } from "@/lib/api-action-error";
import ClientPageHeader from "@/components/layout/ClientPageHeader";
import AmpianaroB2bOffer from "@/components/economy/AmpianaroB2bOffer";
import { useBookingsDashboard } from "@/hooks/useBookingsDashboard";
import {
  BookingsActionError,
  BookingsEmptyFilter,
  BookingsErrorState,
  BookingsFilterChips,
  BookingsListSkeleton,
} from "@/components/dashboard/BookingsDashboardStates";

interface Booking extends BookingCardData {
  createdAt: string;
  provider: { id: string; name: string; phone: string | null };
  review: { id: string; rating: number } | null;
}

const STAT_CARDS: BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export default function ClientDashboardPage() {
  const {
    router,
    bookings,
    loading,
    error,
    actionError,
    setActionError,
    activeFilter,
    setActiveFilter,
    filtered,
    counts,
    fetchBookings,
    updateBookingInState,
  } = useBookingsDashboard<Booking>({
    listUrl: "/api/bookings",
    viewer: "client",
  });

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  const bookingById = (id: string | null) =>
    id ? bookings.find((b) => b.id === id) ?? null : null;

  const runCancel = async (id: string) => {
    setCancellingId(id);
    setActionError("");
    try {
      const data = await apiFetchJson<{ booking?: Partial<Booking> }>(
        `/api/bookings/${id}`,
        { method: "PATCH", body: { status: "CANCELLED" }, router }
      );
      const updated = data.booking ?? { status: "CANCELLED" };
      updateBookingInState(id, {
        status: updated.status ?? "CANCELLED",
        transaction: updated.transaction ?? null,
      });
      setCancelTarget(null);
    } catch (err) {
      const message = messageFromApiAction(err);
      if (message) setActionError(message);
    } finally {
      setCancellingId(null);
    }
  };

  const runPay = async (
    id: string,
    paymentMethod: "ORANGE_MONEY" | "MVOLA" | "AIRTEL_MONEY"
  ) => {
    setPayingId(id);
    setActionError("");
    try {
      const data = await apiFetchJson<{
        booking?: Partial<Booking>;
        transaction?: Booking["transaction"];
      }>(`/api/bookings/${id}/pay`, {
        method: "POST",
        body: { paymentMethod },
        router,
      });
      const updated = data.booking ?? { status: "PAID" };
      updateBookingInState(id, {
        status: updated.status ?? "PAID",
        transaction: data.transaction ?? updated.transaction ?? null,
      });
      setPayTarget(null);
    } catch (err) {
      const message = messageFromApiAction(err);
      if (message) setActionError(message);
    } finally {
      setPayingId(null);
    }
  };

  const handleValidate = async (id: string) => {
    setValidatingId(id);
    setActionError("");
    try {
      const data = await apiFetchJson<{ booking?: Partial<Booking> }>(
        `/api/bookings/${id}`,
        { method: "PATCH", body: { status: "COMPLETED" }, router }
      );
      const updated = data.booking ?? { status: "COMPLETED" };
      updateBookingInState(id, {
        status: updated.status ?? "COMPLETED",
        transaction: updated.transaction ?? null,
      });
    } catch (err) {
      const message = messageFromApiAction(err);
      if (message) setActionError(message);
    } finally {
      setValidatingId(null);
    }
  };

  const handleScheduleChange = async (
    id: string,
    schedule: { date: string; slotStart?: string | null; slotEnd?: string | null }
  ) => {
    setSchedulingId(id);
    setActionError("");
    try {
      const data = await apiFetchJson<{ booking?: Partial<Booking> }>(
        `/api/bookings/${id}/schedule`,
        { method: "PATCH", body: schedule, router }
      );
      const updated = data.booking;
      if (updated) {
        updateBookingInState(id, {
          date: updated.date ?? null,
          slotStart: updated.slotStart ?? null,
          slotEnd: updated.slotEnd ?? null,
        });
      }
    } catch (err) {
      const message = messageFromApiAction(err);
      if (message) setActionError(message);
    } finally {
      setSchedulingId(null);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ClientPageHeader subtitle="Suivez l'état de vos réservations de services" />
        <AmpianaroB2bOffer />
        <BookingsActionError message={actionError} />

        {!loading && !error && bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {STAT_CARDS.map((s) => (
              <div key={s} className="bg-card rounded-xl border border-border p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{counts[s] ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{BOOKING_STATUS_LABEL[s]}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <BookingsFilterChips
            filters={CLIENT_BOOKING_FILTERS}
            activeFilter={activeFilter}
            counts={counts}
            onChange={setActiveFilter}
          />
        )}

        {loading && <BookingsListSkeleton />}
        {!loading && error && (
          <BookingsErrorState error={error} onRetry={() => fetchBookings()} compactRetry />
        )}
        {!loading && !error && bookings.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg mb-2">Aucune réservation pour l&apos;instant</p>
            <p className="text-muted-foreground text-sm mb-6">
              Trouvez un prestataire et réservez votre premier service
            </p>
            <Link
              href="/services"
              className="bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors inline-block"
            >
              Voir les services
            </Link>
          </div>
        )}
        {!loading && !error && bookings.length > 0 && filtered.length === 0 && (
          <BookingsEmptyFilter />
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="flex flex-col gap-4">
            {filtered.map((booking) => {
              const paidViaApp = isBookingPaidViaApp(booking.transaction);
              return (
                <div key={booking.id}>
                  <BookingCard
                    booking={booking}
                    counterpartyLabel="Prestataire"
                    onCancel={(id) => setCancelTarget(id)}
                    cancellingId={cancellingId}
                    onPay={(id) => setPayTarget(id)}
                    onValidate={handleValidate}
                    onScheduleChange={handleScheduleChange}
                    busyId={payingId ?? validatingId ?? schedulingId}
                  />
                  {booking.status === "COMPLETED" && !booking.review && paidViaApp && (
                    <ReviewForm
                      bookingId={booking.id}
                      providerName={booking.provider.name}
                      onSuccess={fetchBookings}
                    />
                  )}
                  {booking.status === "COMPLETED" && !paidViaApp && (
                    <p className="text-xs text-muted-foreground mt-2 ml-1">
                      Avis disponible uniquement pour les prestations payées via l&apos;app.
                    </p>
                  )}
                  {booking.review && (
                    <p className="text-xs text-muted-foreground mt-2 ml-1">
                      ✓ Avis publié ({booking.review.rating}/5)
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={cancelTarget != null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        title="Annuler la réservation"
        description="Annuler cette réservation ? Si un paiement a été effectué, il sera remboursé."
        confirmLabel="Annuler la réservation"
        destructive
        loading={cancellingId != null}
        onConfirm={() => {
          if (cancelTarget) runCancel(cancelTarget);
        }}
      />
      <PaymentDialog
        open={payTarget != null}
        booking={bookingById(payTarget)}
        loading={payingId != null}
        onOpenChange={(open) => {
          if (!open) setPayTarget(null);
        }}
        onConfirm={(method) => {
          if (payTarget) runPay(payTarget, method);
        }}
      />
    </>
  );
}
