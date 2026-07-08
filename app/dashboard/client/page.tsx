"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookingCard, { type BookingCardData } from "@/components/booking/BookingCard";
import ReviewForm from "@/components/reviews/ReviewForm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import PaymentDialog from "@/components/booking/PaymentDialog";

type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PAID"
  | "IN_PROGRESS"
  | "DONE_PENDING_VALIDATION"
  | "COMPLETED"
  | "CANCELLED";

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  PAID: "Payé",
  IN_PROGRESS: "En cours",
  DONE_PENDING_VALIDATION: "À valider",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

interface Booking extends BookingCardData {
  createdAt: string;
  provider: { id: string; name: string; phone: string | null };
  review: { id: string; rating: number } | null;
}

const FILTERS: { label: string; value: BookingStatus | "ALL" }[] = [
  { label: "Toutes", value: "ALL" },
  { label: "En attente", value: "PENDING" },
  { label: "Confirmées", value: "CONFIRMED" },
  { label: "À payer", value: "CONFIRMED" },
  { label: "En cours", value: "IN_PROGRESS" },
  { label: "À valider", value: "DONE_PENDING_VALIDATION" },
  { label: "Terminées", value: "COMPLETED" },
  { label: "Annulées", value: "CANCELLED" },
];

const STAT_CARDS: BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

// ─── Component principal ──────────────────────────────────────────────────────

export default function ClientDashboardPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeFilter, setActiveFilter] = useState<BookingStatus | "ALL">("ALL");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError("");

    try {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        setError(data.error ?? "Erreur lors du chargement");
        return;
      }

      if (data.role === "PROVIDER") {
        router.push("/dashboard/provider");
        return;
      }

      setBookings(data.bookings);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [router]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchBookings({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchBookings]);

  const handleCancel = (id: string) => {
    setCancelTarget(id);
  };

  const updateBookingInState = (id: string, updated: Partial<Booking>) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updated } : b))
    );
  };

  const runCancel = async (id: string) => {
    setCancellingId(id);
    setActionError("");

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        setActionError(data.error ?? "Impossible d'annuler");
        return;
      }

      const updated = data.booking ?? { status: "CANCELLED" };
      updateBookingInState(id, {
        status: updated.status ?? "CANCELLED",
        transaction: updated.transaction ?? null,
      });
      setCancelTarget(null);
    } catch {
      setActionError("Une erreur est survenue");
    } finally {
      setCancellingId(null);
    }
  };

  const handlePay = (id: string) => {
    setPayTarget(id);
  };

  const runPay = async (
    id: string,
    paymentMethod: "ORANGE_MONEY" | "MVOLA" | "AIRTEL_MONEY"
  ) => {
    setPayingId(id);
    setActionError("");

    try {
      const res = await fetch(`/api/bookings/${id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        setActionError(data.error ?? "Paiement échoué");
        return;
      }

      const updated = data.booking ?? { status: "PAID" };
      updateBookingInState(id, {
        status: updated.status ?? "PAID",
        transaction: data.transaction ?? updated.transaction ?? null,
      });
      setPayTarget(null);
    } catch {
      setActionError("Une erreur est survenue");
    } finally {
      setPayingId(null);
    }
  };

  const handleValidate = async (id: string) => {
    setValidatingId(id);
    setActionError("");

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        setActionError(data.error ?? "Validation échouée");
        return;
      }

      const updated = data.booking ?? { status: "COMPLETED" };
      updateBookingInState(id, {
        status: updated.status ?? "COMPLETED",
        transaction: updated.transaction ?? null,
      });
    } catch {
      setActionError("Une erreur est survenue");
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
      const res = await fetch(`/api/bookings/${id}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        setActionError(data.error ?? "Impossible d'enregistrer la date");
        return;
      }

      const updated = data.booking;
      if (updated) {
        updateBookingInState(id, {
          date: updated.date ?? null,
          slotStart: updated.slotStart ?? null,
          slotEnd: updated.slotEnd ?? null,
        });
      }
    } catch {
      setActionError("Une erreur est survenue");
    } finally {
      setSchedulingId(null);
    }
  };

  // ── Filtrage local ────────────────────────────────────────────────────────

  const filtered =
    activeFilter === "ALL"
      ? bookings
      : bookings.filter((b) => b.status === activeFilter);

  // ── Compteurs par statut ──────────────────────────────────────────────────

  const counts = bookings.reduce<Record<string, number>>(
    (acc, b) => ({ ...acc, [b.status]: (acc[b.status] ?? 0) + 1 }),
    {}
  );

  const bookingById = (id: string | null) =>
    id ? bookings.find((b) => b.id === id) ?? null : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground mb-1">Espace client</h1>
          <p className="text-muted-foreground text-sm">
            Suivez l&apos;état de vos réservations de services
          </p>
        </div>

        {actionError && (
          <div className="bg-error-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
            <p className="text-error-700 text-sm">{actionError}</p>
          </div>
        )}

        {/* Stat cards */}
        {!loading && !error && bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {STAT_CARDS.map((s) => (
              <div key={s} className="bg-card rounded-xl border border-border p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{counts[s] ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{STATUS_LABEL[s]}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        {!loading && !error && bookings.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map((f, i) => {
              // Évite les doublons de libellé "À payer" / "Confirmées" (même statut)
              const key = `${f.value}-${i}`;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(f.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    activeFilter === f.value
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-card text-muted-foreground border-neutral-200 hover:border-brand-300"
                  }`}
                >
                  {f.label}
                  {f.value !== "ALL" && counts[f.value]
                    ? ` (${counts[f.value]})`
                    : ""}
                </button>
              );
            })}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6 animate-pulse">
                <div className="h-3 bg-neutral-100 rounded-full w-1/4 mb-3" />
                <div className="h-5 bg-neutral-100 rounded-full w-1/2 mb-6" />
                <div className="h-3 bg-neutral-100 rounded-full w-full mb-2" />
                <div className="h-3 bg-neutral-100 rounded-full w-2/3" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={() => fetchBookings()} className="text-brand-600 font-medium hover:underline text-sm">
              Réessayer
            </button>
          </div>
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
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">Aucune réservation dans cette catégorie</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="flex flex-col gap-4">
            {filtered.map((booking) => {
              const paidViaApp =
                booking.transaction?.status === "ESCROWED" ||
                booking.transaction?.status === "RELEASED" ||
                booking.transaction?.status === "SUCCESS";
              return (
                <div key={booking.id}>
                  <BookingCard
                    booking={booking}
                    counterpartyLabel="Prestataire"
                    onCancel={handleCancel}
                    cancellingId={cancellingId}
                    onPay={handlePay}
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
