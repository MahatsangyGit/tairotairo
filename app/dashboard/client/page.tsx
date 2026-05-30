"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

interface BookingService {
  id:       string;
  title:    string;
  price:    number;
  category: string;
  location: string;
}

interface BookingProvider {
  id:    string;
  name:  string;
  phone: string | null;
}

interface Booking {
  id:        string;
  status:    BookingStatus;
  date:      string;
  createdAt: string;
  service:   BookingService;
  provider:  BookingProvider;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING:   "En attente",
  CONFIRMED: "Confirmé",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

const STATUS_CLASS: Record<BookingStatus, string> = {
  PENDING:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

// ─── Sous-composant : badge statut ────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

// ─── Sous-composant : carte réservation ───────────────────────────────────────

function BookingCard({
  booking,
  onCancel,
  cancellingId,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
  cancellingId: string | null;
}) {
  const date = new Date(booking.date).toLocaleDateString("fr-MG", {
    day:   "numeric",
    month: "long",
    year:  "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full mb-2">
            {booking.service.category}
          </span>
          <h3 className="font-semibold text-gray-800">{booking.service.title}</h3>
          <p className="text-gray-500 text-sm mt-0.5">📍 {booking.service.location}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Date prévue</p>
          <p className="text-sm font-medium text-gray-700">{date}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Prix</p>
          <p className="text-sm font-medium text-emerald-600">
            {booking.service.price.toLocaleString("fr-MG")} Ar
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Prestataire</p>
          <p className="text-sm font-medium text-gray-700">{booking.provider.name}</p>
        </div>
        {booking.provider.phone && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Contact</p>
            <p className="text-sm font-medium text-gray-700">{booking.provider.phone}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
          <button
            onClick={() => onCancel(booking.id)}
            disabled={cancellingId === booking.id}
            className="text-sm text-red-600 font-medium border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            {cancellingId === booking.id ? "..." : "Annuler la réservation"}
          </button>
        )}
        <Link
          href={`/services/${booking.service.id}`}
          className="text-sm text-emerald-600 font-medium hover:underline ml-auto"
        >
          Voir le service →
        </Link>
      </div>
    </div>
  );
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

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res  = await fetch("/api/bookings");
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
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchBookings();
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

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b))
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            Mes réservations
          </h1>
          <p className="text-gray-500 text-sm">
            Suivez l'état de vos demandes de service
          </p>
        </div>

        {actionError && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {actionError}
          </p>
        )}

        {/* Stat cards */}
        {!loading && !error && bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as BookingStatus[]).map((s) => (
              <div key={s} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-2xl font-bold text-gray-800">{counts[s] ?? 0}</p>
                <p className="text-xs text-gray-400 mt-0.5">{STATUS_LABEL[s]}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filtres */}
        {!loading && !error && bookings.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  activeFilter === f.value
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400"
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
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-6" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Erreur */}
        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchBookings}
              className="text-emerald-600 font-medium hover:underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Aucune réservation */}
        {!loading && !error && bookings.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-2">Aucune réservation pour l'instant</p>
            <p className="text-gray-400 text-sm mb-6">
              Trouvez un prestataire et réservez votre premier service
            </p>
            <Link
              href="/services"
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors inline-block"
            >
              Voir les services
            </Link>
          </div>
        )}

        {/* Liste filtrée vide */}
        {!loading && !error && bookings.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">Aucune réservation dans cette catégorie</p>
          </div>
        )}

        {/* Liste */}
        {!loading && !error && filtered.length > 0 && (
          <div className="flex flex-col gap-4">
            {filtered.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                cancellingId={cancellingId}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}