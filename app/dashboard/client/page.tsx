"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ClientNav from "@/components/layout/ClientNav";
import BookingCard, { type BookingCardData } from "@/components/booking/BookingCard";
import ReviewForm from "@/components/reviews/ReviewForm";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

interface Booking extends BookingCardData {
  createdAt: string;
  provider: { id: string; name: string; phone: string | null };
  review: { id: string; rating: number } | null;
}

// ─── Filtres ──────────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: BookingStatus | "ALL" }[] = [
  { label: "Toutes",     value: "ALL" },
  { label: "En attente", value: "PENDING" },
  { label: "Confirmées", value: "CONFIRMED" },
  { label: "Terminées",  value: "COMPLETED" },
  { label: "Annulées",   value: "CANCELLED" },
];

// ─── Component principal ──────────────────────────────────────────────────────

export default function ClientDashboardPage() {
  const router = useRouter();

  const [bookings,      setBookings]      = useState<Booking[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [actionError,   setActionError]   = useState("");
  const [activeFilter,  setActiveFilter]  = useState<BookingStatus | "ALL">("ALL");
  const [cancellingId,  setCancellingId]  = useState<string | null>(null);

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

  const handleCancel = async (id: string) => {
    if (!confirm("Annuler cette réservation ?")) return;

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
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: updated.status ?? "CANCELLED" } : b
        )
      );
    } catch {
      setActionError("Une erreur est survenue");
    } finally {
      setCancellingId(null);
    }
  };

  // ── Filtrage local ────────────────────────────────────────────────────────

  const filtered = activeFilter === "ALL"
    ? bookings
    : bookings.filter((b) => b.status === activeFilter);

  // ── Compteurs par statut ──────────────────────────────────────────────────

  const counts = bookings.reduce<Record<string, number>>(
    (acc, b) => ({ ...acc, [b.status]: (acc[b.status] ?? 0) + 1 }),
    {}
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="mb-2">
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Espace client</h1>
          <p className="text-neutral-500 text-sm">
            Suivez l&apos;état de vos réservations de services
          </p>
        </div>

        <ClientNav />

        {actionError && (
          <div className="bg-error-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
            <p className="text-error-700 text-sm">{actionError}</p>
          </div>
        )}

        {/* Stat cards */}
        {!loading && !error && bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as BookingStatus[]).map((s) => (
              <div key={s} className="bg-white rounded-xl border border-neutral-200 p-4 text-center">
                <p className="text-2xl font-bold text-neutral-900">{counts[s] ?? 0}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{STATUS_LABEL[s]}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        {!loading && !error && bookings.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  activeFilter === f.value
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-brand-300"
                }`}
              >
                {f.label}
                {f.value !== "ALL" && counts[f.value]
                  ? ` (${counts[f.value]})`
                  : ""}
              </button>
            ))}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-200 p-6 animate-pulse">
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
            <p className="text-neutral-600 text-lg mb-2">Aucune réservation pour l&apos;instant</p>
            <p className="text-neutral-400 text-sm mb-6">
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
            <p className="text-neutral-400 text-sm">Aucune réservation dans cette catégorie</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="flex flex-col gap-4">
            {filtered.map((booking) => (
              <div key={booking.id}>
                <BookingCard
                  booking={booking}
                  counterpartyLabel="Prestataire"
                  onCancel={handleCancel}
                  cancellingId={cancellingId}
                />
                {booking.status === "COMPLETED" && !booking.review && (
                  <ReviewForm
                    bookingId={booking.id}
                    providerName={booking.provider.name}
                    onSuccess={fetchBookings}
                  />
                )}
                {booking.review && (
                  <p className="text-xs text-neutral-400 mt-2 ml-1">
                    ✓ Avis publié ({booking.review.rating}/5)
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}