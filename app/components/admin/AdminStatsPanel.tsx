"use client";

import { useCallback, useEffect, useState } from "react";

interface AdminStats {
  generatedAt: string;
  users: {
    clients: number;
    providers: number;
    admins: number;
    newClients30: number;
    newProviders30: number;
  };
  kyc: { approved: number; pending: number; notStarted: number };
  subscriptions: {
    active: number;
    expiringSoon: number;
    featuredProviders: number;
  };
  services: {
    total: number;
    available: number;
    featured: number;
    topCategories: { category: string; count: number }[];
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    last30Days: number;
  };
  requests: { open: number; total: number };
  reviews: { total: number; averageRating: number | null };
  messaging: { conversations: number; messages: number };
  transactions: { successful: number; totalRevenue: number };
}

const EXPORT_OPTIONS = [
  { type: "stats", label: "Statistiques", description: "Synthèse des indicateurs" },
  { type: "providers", label: "Prestataires", description: "Profils, KYC, abonnements" },
  { type: "clients", label: "Clients", description: "Comptes et activité" },
  { type: "services", label: "Annonces", description: "Toutes les offres publiées" },
  { type: "bookings", label: "Réservations", description: "Historique complet" },
  { type: "subscriptions", label: "Abonnements", description: "Abonnements prestataires" },
] as const;

function StatCard({
  label,
  value,
  hint,
  accent = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "brand" | "amber" | "blue" | "neutral";
}) {
  const accentClass = {
    brand: "border-brand-100 bg-brand-50/50",
    amber: "border-amber-100 bg-amber-50/50",
    blue: "border-blue-100 bg-blue-50/50",
    neutral: "border-neutral-200 bg-white",
  }[accent];

  return (
    <div className={`rounded-2xl border p-5 ${accentClass}`}>
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
      {hint && <p className="text-xs text-neutral-500 mt-1">{hint}</p>}
    </div>
  );
}

function BreakdownBar({
  label,
  segments,
}: {
  label: string;
  segments: { name: string; value: number; color: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <div>
        <p className="text-sm font-medium text-neutral-700 mb-2">{label}</p>
        <p className="text-xs text-neutral-400">Aucune donnée</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-neutral-700 mb-3">{label}</p>
      <div className="flex h-3 rounded-full overflow-hidden bg-neutral-100 mb-3">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.name}
              className={s.color}
              style={{ width: `${(s.value / total) * 100}%` }}
              title={`${s.name}: ${s.value}`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span key={s.name} className="text-xs text-neutral-600">
            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${s.color}`} />
            {s.name} ({s.value})
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminStatsPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur de chargement");
        return;
      }
      setStats(data);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = (type: string) => {
    setExporting(type);
    window.location.href = `/api/admin/export?type=${type}`;
    setTimeout(() => setExporting(null), 1500);
  };

  if (loading) {
    return <p className="text-neutral-500">Chargement des statistiques…</p>;
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || "Données indisponibles"}</p>
        <button
          type="button"
          onClick={load}
          className="text-brand-600 font-medium hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-neutral-400">
          Mis à jour le{" "}
          {new Date(stats.generatedAt).toLocaleString("fr-MG", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        <button
          type="button"
          onClick={load}
          className="text-sm text-brand-600 font-medium hover:text-brand-700"
        >
          Actualiser
        </button>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Vue d&apos;ensemble</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Clients" value={stats.users.clients} hint={`+${stats.users.newClients30} sur 30 j`} />
          <StatCard label="Prestataires" value={stats.users.providers} hint={`+${stats.users.newProviders30} sur 30 j`} accent="blue" />
          <StatCard label="Abonnements actifs" value={stats.subscriptions.active} hint={`${stats.subscriptions.expiringSoon} expirent sous 7 j`} accent="amber" />
          <StatCard label="Réservations" value={stats.bookings.total} hint={`${stats.bookings.last30Days} sur 30 j`} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <BreakdownBar
            label="Réservations par statut"
            segments={[
              { name: "En attente", value: stats.bookings.pending, color: "bg-yellow-400" },
              { name: "Confirmées", value: stats.bookings.confirmed, color: "bg-blue-400" },
              { name: "Terminées", value: stats.bookings.completed, color: "bg-brand-500" },
              { name: "Annulées", value: stats.bookings.cancelled, color: "bg-red-400" },
            ]}
          />
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <BreakdownBar
            label="Prestataires — vérification KYC"
            segments={[
              { name: "Approuvés", value: stats.kyc.approved, color: "bg-brand-500" },
              { name: "En attente", value: stats.kyc.pending, color: "bg-amber-400" },
              { name: "Non soumis", value: stats.kyc.notStarted, color: "bg-neutral-300" },
            ]}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Activité & contenu</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Annonces en ligne" value={stats.services.available} hint={`${stats.services.total} au total`} accent="neutral" />
          <StatCard label="Annonces en avant" value={stats.services.featured} hint={`${stats.subscriptions.featuredProviders} prestataires`} accent="amber" />
          <StatCard label="Demandes ouvertes" value={stats.requests.open} hint={`${stats.requests.total} au total`} accent="neutral" />
          <StatCard
            label="Note moyenne"
            value={stats.reviews.averageRating ?? "—"}
            hint={`${stats.reviews.total} avis`}
            accent="neutral"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <h3 className="text-sm font-semibold text-neutral-800 mb-4">Top catégories</h3>
          {stats.services.topCategories.length === 0 ? (
            <p className="text-sm text-neutral-400">Aucune annonce</p>
          ) : (
            <ul className="space-y-3">
              {stats.services.topCategories.map((c) => {
                const pct = Math.round(
                  (c.count / Math.max(stats.services.total, 1)) * 100
                );
                return (
                  <li key={c.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-700">{c.category}</span>
                      <span className="text-neutral-500">{c.count}</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <h3 className="text-sm font-semibold text-neutral-800 mb-4">Messagerie & paiements</h3>
          <dl className="space-y-4">
            <div className="flex justify-between text-sm">
              <dt className="text-neutral-500">Conversations</dt>
              <dd className="font-medium text-neutral-800">{stats.messaging.conversations}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-neutral-500">Messages envoyés</dt>
              <dd className="font-medium text-neutral-800">{stats.messaging.messages}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-neutral-500">Transactions réussies</dt>
              <dd className="font-medium text-neutral-800">{stats.transactions.successful}</dd>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-neutral-100">
              <dt className="text-neutral-500">Revenu enregistré</dt>
              <dd className="font-bold text-brand-700">
                {stats.transactions.totalRevenue.toLocaleString("fr-MG")} Ar
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-neutral-800 mb-2">Exports CSV</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Téléchargez les données au format CSV (UTF-8, compatible Excel).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EXPORT_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              type="button"
              disabled={exporting != null}
              onClick={() => handleExport(opt.type)}
              className="text-left bg-white rounded-xl border border-neutral-200 px-4 py-3 hover:border-brand-300 hover:bg-brand-50/30 transition-colors disabled:opacity-50"
            >
              <p className="text-sm font-medium text-neutral-800">
                {exporting === opt.type ? "Téléchargement…" : `Exporter ${opt.label}`}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
