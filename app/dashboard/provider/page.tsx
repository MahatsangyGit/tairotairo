"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProviderKycBanner from "@/components/kyc/ProviderKycBanner";
import { getBookingDisplayInfo } from "@/lib/booking-display";
import { formatSchedule } from "@/lib/datetime-slot";
import { MapPinIcon } from "@/components/ui/app-icons";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

interface BookingClient {
  id: string;
  name: string;
  phone: string | null;
  email: string;
}

interface Booking {
  id: string;
  status: BookingStatus;
  date: string;
  slotStart?: string | null;
  slotEnd?: string | null;
  createdAt: string;
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
  client: BookingClient;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

const STATUS_CLASS: Record<BookingStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-brand-50 text-brand-700 border-brand-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const FILTERS: { label: string; value: BookingStatus | "ALL" }[] = [
  { label: "Toutes", value: "ALL" },
  { label: "En attente", value: "PENDING" },
  { label: "Confirmées", value: "CONFIRMED" },
  { label: "Terminées", value: "COMPLETED" },
  { label: "Annulées", value: "CANCELLED" },
];

const REQUEST_TIMEOUT_MS =
  process.env.NODE_ENV === "production" ? 20_000 : null;

// ─── Sous-composants ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function BookingCard({
  booking,
  onStatusChange,
  updatingId,
}: {
  booking: Booking;
  onStatusChange: (id: string, status: BookingStatus) => void;
  updatingId: string | null;
}) {
  const display = getBookingDisplayInfo(booking, { viewer: "provider" });
  const date = formatSchedule(
    booking.date,
    booking.slotStart,
    booking.slotEnd
  );
  const isUpdating = updatingId === booking.id;

  const categoryClass =
    display.source === "request"
      ? "bg-amber-50 text-amber-800"
      : "bg-brand-50 text-brand-700";

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
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
          <h3 className="font-semibold text-foreground">{display.title}</h3>
          <p className="text-muted-foreground text-sm mt-0.5"><MapPinIcon /> {display.location}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Date prévue</p>
          <p className="text-sm font-medium text-foreground">{date}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Prix</p>
          <p className="text-sm font-medium text-brand-600">
            {display.price.toLocaleString("fr-MG")} Ar
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Client</p>
          <p className="text-sm font-medium text-foreground">{booking.client.name}</p>
        </div>
        {booking.client.phone && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Téléphone</p>
            <a
              href={`tel:${booking.client.phone}`}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              {booking.client.phone}
            </a>
          </div>
        )}
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground mb-0.5">Email</p>
          <a
            href={`mailto:${booking.client.email}`}
            className="text-sm font-medium text-foreground hover:text-brand-600"
          >
            {booking.client.email}
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {booking.status === "PENDING" && (
          <>
            <button
              onClick={() => onStatusChange(booking.id, "CONFIRMED")}
              disabled={isUpdating}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? "..." : "Confirmer"}
            </button>
            <button
              onClick={() => onStatusChange(booking.id, "CANCELLED")}
              disabled={isUpdating}
              className="bg-card text-red-600 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Refuser
            </button>
          </>
        )}
        {booking.status === "CONFIRMED" && (
          <>
            <button
              onClick={() => onStatusChange(booking.id, "COMPLETED")}
              disabled={isUpdating}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? "..." : "Marquer terminé"}
            </button>
            <button
              onClick={() => onStatusChange(booking.id, "CANCELLED")}
              disabled={isUpdating}
              className="bg-card text-red-600 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Annuler
            </button>
          </>
        )}
        <Link
          href={display.href}
          className="text-sm text-brand-600 font-medium hover:underline ml-auto"
        >
          {display.source === "request"
            ? display.archived
              ? "Historique des propositions →"
              : "Voir la demande →"
            : "Voir l'annonce →"}
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProviderDashboardPage() {
  const router = useRouter();
  const fetchSeqRef = useRef(0);
  const activeFetchControllerRef = useRef<AbortController | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<BookingStatus | "ALL">("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const fetchBookings = async (options?: { silent?: boolean }) => {
    // Un rafraîchissement silencieux ne doit jamais interrompre un chargement en cours.
    if (options?.silent && activeFetchControllerRef.current) return;

    const fetchSeq = ++fetchSeqRef.current;
    activeFetchControllerRef.current?.abort();
    const controller = new AbortController();
    activeFetchControllerRef.current = controller;

    if (!options?.silent) {
      setLoading(true);
      setError("");
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      if (REQUEST_TIMEOUT_MS != null) {
        timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      }
      const res = await fetch("/api/bookings?limit=12", {
        cache: "no-store",
        signal: controller.signal,
      });

      const data = await res
        .json()
        .catch(() => ({ error: "Réponse serveur invalide" }));

      if (fetchSeq !== fetchSeqRef.current) return;

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        if (!options?.silent) {
          setError(data.error ?? "Erreur lors du chargement");
        }
        return;
      }

      if (data.role !== "PROVIDER" && data.role !== "ADMIN") {
        router.push("/dashboard/client");
        return;
      }

      setBookings(data.bookings);
      setError("");
    } catch (err) {
      if (fetchSeq !== fetchSeqRef.current) return;
      if (options?.silent) return;
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Le serveur met trop de temps à répondre. Réessayez.");
      } else {
        setError("Une erreur est survenue");
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      // Seule la requête la plus récente contrôle l'état de chargement :
      // on coupe toujours le skeleton quand elle se termine, silencieuse ou non.
      if (fetchSeq === fetchSeqRef.current) {
        activeFetchControllerRef.current = null;
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchBookings({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      activeFetchControllerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (id: string, status: BookingStatus) => {
    setUpdatingId(id);
    setActionError("");

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        setActionError(data.error ?? "Impossible de mettre à jour le statut");
        return;
      }

      if (data.booking) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, ...data.booking } : b))
        );
      } else {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status } : b))
        );
      }
    } catch {
      setActionError("Une erreur est survenue");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered =
    activeFilter === "ALL"
      ? bookings
      : bookings.filter((b) => b.status === activeFilter);

  const counts = bookings.reduce<Record<string, number>>(
    (acc, b) => {
      acc[b.status] = (acc[b.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const pendingCount = counts.PENDING ?? 0;

  return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Espace prestataire
          </h1>
          <p className="text-muted-foreground text-sm">
            Gérez les demandes de réservation pour vos services
          </p>
          {pendingCount > 0 && (
            <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
              {pendingCount} demande{pendingCount > 1 ? "s" : ""} en attente de
              réponse
            </p>
          )}
        </div>
        <ProviderKycBanner />

        {actionError && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {actionError}
          </p>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as BookingStatus[]).map(
              (s) => (
                <div
                  key={s}
                  className="bg-card rounded-xl border border-border p-4 text-center"
                >
                  <p className="text-2xl font-bold text-foreground">{counts[s] ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{STATUS_LABEL[s]}</p>
                </div>
              )
            )}
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  activeFilter === f.value
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-card text-muted-foreground border-gray-200 hover:border-brand-400"
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

        {loading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-6" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => fetchBookings()}
              className="text-brand-600 font-medium hover:underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="text-center py-20">
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
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">Aucune réservation dans cette catégorie</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="flex flex-col gap-4">
            {filtered.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onStatusChange={handleStatusChange}
                updatingId={updatingId}
              />
            ))}
          </div>
        )}
      </div>
  );
}
