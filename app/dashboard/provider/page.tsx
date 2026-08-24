"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProviderKycBanner from "@/components/kyc/ProviderKycBanner";
import BookingCard, { type BookingCardData } from "@/components/booking/BookingCard";
import {
  type BookingStatus,
  type TransactionStatus,
  bookingStatusLabel,
  PROVIDER_BOOKING_FILTERS,
} from "@/lib/booking-status";
import { apiFetch, apiFetchJson, ApiClientError } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Sous-composants ──────────────────────────────────────────────────────────

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
      const data = await apiFetch<{
        role?: string;
        bookings: Booking[];
      }>("/api/bookings?limit=12", {
        cache: "no-store",
        signal: controller.signal,
        router,
      });

      if (fetchSeq !== fetchSeqRef.current) return;

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
      } else if (err instanceof ApiClientError) {
        if (err.status !== 401) setError(err.message);
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
      const data = await apiFetchJson<{ booking?: Partial<Booking> }>(
        `/api/bookings/${id}`,
        { method: "PATCH", body: { status }, router }
      );

      if (data.booking) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, ...data.booking } : b))
        );
      } else {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status } : b))
        );
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.status !== 401) {
        setActionError(err.message);
      } else if (!(err instanceof ApiClientError)) {
        setActionError("Une erreur est survenue");
      }
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

  const invoicedBookings = bookings
    .filter(
      (b) =>
        b.status === "COMPLETED" && b.transaction?.status === "RELEASED"
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

        {actionError && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {actionError}
          </p>
        )}

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
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Filtrer les réservations</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {PROVIDER_BOOKING_FILTERS.map((f) => (
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
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">Aucune réservation dans cette catégorie</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">Activité récente</h2>
              <span className="text-xs text-muted-foreground">{filtered.length} élément{filtered.length > 1 ? "s" : ""}</span>
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
              <span className="text-xs text-muted-foreground">{invoicedBookings.length} facture{invoicedBookings.length > 1 ? "s" : ""}</span>
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
