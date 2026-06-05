"use client";

import { useCallback, useEffect, useState } from "react";
import { SUBSCRIPTION_PERIOD_DAYS } from "@/lib/subscription";

interface ProviderRow {
  id: string;
  name: string;
  email: string;
  kycStatus: string;
  featuredOnHomepage: boolean;
  subscription: {
    expiresAt: string;
    isActive: boolean;
    notes: string | null;
  } | null;
  servicesCount: number;
}

interface ServiceRow {
  id: string;
  title: string;
  category: string;
  available: boolean;
  featuredOnHomepage: boolean;
  providerName: string;
  providerSubscriptionActive: boolean;
}

export default function AdminSpotlightPanel() {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/spotlight");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur de chargement");
        return;
      }
      setProviders(data.providers ?? []);
      setServices(data.services ?? []);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grantSubscription = async (providerId: string, months: number) => {
    setBusyId(`sub-${providerId}`);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/providers/${providerId}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec");
        return;
      }
      setSuccess(data.message);
      await load();
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setBusyId(null);
    }
  };

  const revokeSubscription = async (providerId: string) => {
    if (!confirm("Retirer l'abonnement et toutes les mises en avant de ce prestataire ?")) {
      return;
    }
    setBusyId(`revoke-${providerId}`);
    try {
      const res = await fetch(`/api/admin/providers/${providerId}/subscription`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec");
        return;
      }
      setSuccess(data.message);
      await load();
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Chargement…</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-gray-600 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
        L&apos;<strong>abonnement mensuel actif</strong> ({SUBSCRIPTION_PERIOD_DAYS}{" "}
        jours par période) met automatiquement le prestataire en avant sur
        l&apos;accueil (si KYC approuvé), dans{" "}
        <strong>« Nos suggestions »</strong> sur la recherche, et lui permet de
        choisir une annonce à mettre en avant depuis son espace prestataire.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Prestataires & abonnements</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Prestataire</th>
                <th className="px-4 py-3 font-medium">KYC</th>
                <th className="px-4 py-3 font-medium">Abonnement</th>
                <th className="px-4 py-3 font-medium">En avant</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {providers.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.kycStatus === "APPROVED"
                          ? "text-brand-600 text-xs"
                          : "text-amber-600 text-xs"
                      }
                    >
                      {p.kycStatus === "APPROVED" ? "Approuvé" : "Non validé"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {p.subscription?.isActive ? (
                      <>
                        <span className="text-brand-700 font-medium">Actif</span>
                        <br />
                        jusqu&apos;au{" "}
                        {new Date(p.subscription.expiresAt).toLocaleDateString("fr-MG")}
                      </>
                    ) : (
                      <span className="text-gray-400">Aucun / expiré</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.featuredOnHomepage ? (
                      <span className="text-amber-700 text-xs font-medium">★ Oui</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Non</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId != null}
                        onClick={() => grantSubscription(p.id, 1)}
                        className="text-xs border border-brand-200 text-brand-700 px-2 py-1 rounded hover:bg-brand-50 disabled:opacity-50"
                      >
                        +1 mois
                      </button>
                      {p.subscription?.isActive && (
                        <button
                          type="button"
                          disabled={busyId != null}
                          onClick={() => revokeSubscription(p.id)}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          Retirer abo.
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Annonces</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600 sticky top-0">
              <tr>
                <th className="px-4 py-3 font-medium">Annonce</th>
                <th className="px-4 py-3 font-medium">Prestataire</th>
                <th className="px-4 py-3 font-medium">Abo.</th>
                <th className="px-4 py-3 font-medium">En avant</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 line-clamp-1">{s.title}</p>
                    <p className="text-xs text-gray-400">
                      {s.category}
                      {!s.available && " · indisponible"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.providerName}</td>
                  <td className="px-4 py-3">
                    {s.providerSubscriptionActive ? (
                      <span className="text-brand-600 text-xs">Actif</span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {s.featuredOnHomepage ? (
                      <span className="text-amber-700 text-xs font-medium">★ Oui</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Non</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {s.featuredOnHomepage
                      ? "Choix du prestataire"
                      : s.providerSubscriptionActive
                        ? "Non sélectionnée"
                        : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-brand-600 text-sm">{success}</p>}
    </div>
  );
}
