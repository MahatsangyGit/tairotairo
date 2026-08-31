"use client";

import Link from "next/link";
import ProviderKycBanner from "@/components/kyc/ProviderKycBanner";
import BookingCard, { type BookingCardData } from "@/components/booking/BookingCard";
import {
  type BookingStatus,
  type TransactionStatus,
  bookingStatusLabel,
  PROVIDER_BOOKING_FILTERS,
} from "@/lib/booking-status";
import { useBookingsDashboard } from "@/hooks/useBookingsDashboard";
import {
  BookingsActionError,
  BookingsEmptyFilter,
  BookingsErrorState,
  BookingsFilterChips,
  BookingsListSkeleton,
} from "@/components/dashboard/BookingsDashboardStates";
import { useState } from "react";

interface Booking extends BookingCardData {
  createdAt: string;
  client: { id: string; name: string; phone: string | null; email: string };
  transaction?: {
    id: string;
    amount: number;
    status: TransactionStatus;
    releasedAt?: string | null;
  } | null;
}

const REQUEST_TIMEOUT_MS =
  process.env.NODE_ENV === "production" ? 20_000 : null;

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : tone === "success"
        ? "text-brand-700 bg-brand-50 border-brand-200"
        : "text-foreground bg-card border-border";

  return (
    <div className={`rounded-2xl border px-4 py-4 ${toneClass}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-card px-4 py-3 hover:border-brand-300 hover:shadow-sm transition-all"
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </Link>
  );
}

export default function ProviderDashboardPage() {
  const {
    bookings,
    loading,
    error,
    actionError,
    activeFilter,
    setActiveFilter,
    filtered,
    counts,
    fetchBookings,
    patchBooking,
    updateBookingInState,
  } = useBookingsDashboard<Booking>({
    listUrl: "/api/bookings?limit=12",
    viewer: "provider",
    abortTimeoutMs: REQUEST_TIMEOUT_MS,
  });

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: BookingStatus) => {
    setUpdatingId(id);
    try {
      const booking = await patchBooking(id, { status });
      if (!booking) {
        updateBookingInState(id, { status } as Partial<Booking>);
      }
    } catch {
      /* actionError set by hook */
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = counts.PENDING ?? 0;

  const invoicedBookings = bookings
    .filter(
      (b) => b.status === "COMPLETED" && b.transaction?.status === "RELEASED"
    )
    .sort((a, b) =>
      (b.transaction?.releasedAt ?? "").localeCompare(
        a.transaction?.releasedAt ?? ""
      )
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-10">
      <section className="mb-6 rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
              Dashboard prestataire
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              Espace prestataire
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gérez vos réservations, messages et annonces depuis un seul endroit.
            </p>
            {pendingCount > 0 && (
              <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
                {pendingCount} demande{pendingCount > 1 ? "s" : ""} en attente de réponse
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 md:w-[360px]">
            <QuickAction
              href="/dashboard/provider/services"
              title="Mes annonces"
              description="Créer, modifier, publier"
            />
            <QuickAction
              href="/dashboard/provider/messages"
              title="Messages"
              description="Répondre rapidement"
            />
            <QuickAction
              href="/dashboard/provider/profile"
              title="Mon profil"
              description="Infos & visibilité"
            />
            <QuickAction
              href="/requests"
              title="Demandes publiques"
              description="Parcourir les demandes"
            />
          </div>
        </div>
      </section>

      <ProviderKycBanner />
      <BookingsActionError message={actionError} variant="provider" />

      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard
            label={bookingStatusLabel("PENDING", "provider")}
            value={counts.PENDING ?? 0}
            tone={pendingCount > 0 ? "warning" : "default"}
          />
          <StatCard
            label="À payer / à démarrer"
            value={(counts.CONFIRMED ?? 0) + (counts.PAID ?? 0)}
          />
          <StatCard
            label="En cours"
            value={(counts.IN_PROGRESS ?? 0) + (counts.DONE_PENDING_VALIDATION ?? 0)}
          />
          <StatCard
            label={bookingStatusLabel("COMPLETED", "provider")}
            value={counts.COMPLETED ?? 0}
            tone="success"
          />
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="mb-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Filtrer les réservations
          </p>
          <BookingsFilterChips
            filters={PROVIDER_BOOKING_FILTERS}
            activeFilter={activeFilter}
            counts={counts}
            onChange={setActiveFilter}
            chipPadding="px-4 py-2"
            chipClassName={(active) =>
              active
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-card text-muted-foreground border-gray-200 hover:border-brand-400"
            }
          />
        </div>
      )}

      {loading && <BookingsListSkeleton variant="provider" />}
      {!loading && error && (
        <BookingsErrorState error={error} onRetry={() => fetchBookings()} />
      )}
      {!loading && !error && bookings.length === 0 && (
        <div className="text-center py-20 rounded-2xl border border-border bg-card">
          <p className="text-muted-foreground text-lg mb-2">Aucune réservation pour l&apos;instant</p>
          <p className="text-muted-foreground text-sm mb-6">
            Publiez un service pour recevoir des demandes de clients
          </p>
          <Link
            href="/services"
            className="bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors inline-block"
          >
            Voir le catalogue
          </Link>
        </div>
      )}
      {!loading && !error && bookings.length > 0 && filtered.length === 0 && (
        <BookingsEmptyFilter />
      )}
      {!loading && !error && filtered.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Activité récente</h2>
            <span className="text-xs text-muted-foreground">
              {filtered.length} élément{filtered.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {filtered.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                counterpartyLabel="Client"
                onStatusChange={handleStatusChange}
                updatingId={updatingId}
              />
            ))}
          </div>
        </section>
      )}

      {!loading && !error && invoicedBookings.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Factures</h2>
            <span className="text-xs text-muted-foreground">
              {invoicedBookings.length} facture{invoicedBookings.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border">
            {invoicedBookings.map((booking) => {
              const title =
                booking.displayTitle ??
                booking.service?.title ??
                booking.requestResponse?.request?.title ??
                "Prestation";
              const gross = booking.transaction?.amount ?? booking.displayPrice ?? 0;
              const amount = gross - (booking.commissionAmount ?? 0);
              const dateLabel = booking.transaction?.releasedAt
                ? new Date(booking.transaction.releasedAt).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—";
              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {dateLabel} · {amount.toLocaleString("fr-MG")} Ar · {booking.client.name}
                    </p>
                  </div>
                  <a
                    href={`/api/bookings/${booking.id}/invoice`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-brand-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors shrink-0"
                  >
                    Télécharger (PDF)
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
