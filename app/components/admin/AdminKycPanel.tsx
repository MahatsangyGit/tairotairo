"use client";

import { useCallback, useEffect, useState } from "react";
import {
  documentTypeLabel,
  formatFileSize,
  kycStatusLabel,
  type KycDocumentType,
} from "@/lib/kyc";

type Filter = "pending" | "all" | "approved";

interface KycDocument {
  id: string;
  type: KycDocumentType;
  cinSlot: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

interface ProviderKycRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  kycStatus: string;
  kycSubmittedAt: string | null;
  createdAt: string;
  documents: KycDocument[];
  isComplete: boolean;
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: "pending", label: "En attente" },
  { id: "all", label: "Tous les dossiers" },
  { id: "approved", label: "Approuvés" },
];

function statusBadgeClass(status: string): string {
  switch (status) {
    case "APPROVED":
      return "bg-brand-50 text-brand-700 border-brand-200";
    case "PENDING":
      return "bg-amber-50 text-amber-800 border-amber-200";
    default:
      return "bg-neutral-50 text-neutral-600 border-neutral-200";
  }
}

export default function AdminKycPanel() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [providers, setProviders] = useState<ProviderKycRow[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, incomplete: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/kyc?filter=${filter}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur de chargement");
        return;
      }
      setProviders(data.providers ?? []);
      setCounts(data.counts ?? { pending: 0, approved: 0, incomplete: 0 });
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (providerId: string, action: "approve" | "reject") => {
    const label = action === "approve" ? "approuver" : "refuser";
    if (
      !confirm(
        action === "approve"
          ? "Approuver l'identité de ce prestataire ?"
          : "Refuser ce dossier KYC ? Le prestataire devra soumettre à nouveau."
      )
    ) {
      return;
    }

    setBusyId(`${action}-${providerId}`);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/providers/${providerId}/kyc`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Impossible de ${label}`);
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

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-neutral-600 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
        Vérifiez les documents CIN des prestataires et validez ou refusez leur
        identité. Un prestataire approuvé peut publier des annonces et répondre aux
        demandes.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filter === f.id
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-brand-300"
            }`}
          >
            {f.label}
            {f.id === "pending" && counts.pending > 0 && (
              <span className="ml-1.5 bg-amber-400 text-amber-900 text-xs px-1.5 py-0.5 rounded-full">
                {counts.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
        <span>{counts.pending} en attente</span>
        <span>{counts.approved} approuvés</span>
        <span>{counts.incomplete} dossiers incomplets</span>
      </div>

      {loading && <p className="text-neutral-500 text-sm">Chargement…</p>}

      {!loading && providers.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100">
          <p className="text-neutral-500">Aucun dossier dans cette catégorie</p>
        </div>
      )}

      {!loading && providers.length > 0 && (
        <div className="flex flex-col gap-4">
          {providers.map((p) => (
            <article
              key={p.id}
              className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-neutral-100 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-neutral-900">{p.name}</h3>
                  <p className="text-sm text-neutral-500">{p.email}</p>
                  {p.phone && (
                    <p className="text-xs text-neutral-400 mt-0.5">{p.phone}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusBadgeClass(p.kycStatus)}`}
                  >
                    {kycStatusLabel(p.kycStatus)}
                  </span>
                  {p.kycSubmittedAt && (
                    <span className="text-xs text-neutral-400">
                      Soumis le{" "}
                      {new Date(p.kycSubmittedAt).toLocaleDateString("fr-MG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>

              <div className="px-5 py-4">
                {p.documents.length === 0 ? (
                  <p className="text-sm text-neutral-400">Aucun document</p>
                ) : (
                  <ul className="space-y-2">
                    {p.documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-neutral-50 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-800">
                            {documentTypeLabel(doc.type, doc.cinSlot)}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">
                            {doc.originalName} · {formatFileSize(doc.sizeBytes)}
                          </p>
                        </div>
                        <a
                          href={`/api/provider/kyc/documents/${doc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-brand-600 font-medium hover:underline shrink-0"
                        >
                          Voir le document →
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                {!p.isComplete && p.documents.length > 0 && (
                  <p className="text-xs text-amber-700 mt-3">
                    Dossier incomplet (CIN manquante ou invalide)
                  </p>
                )}
              </div>

              <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100 flex flex-wrap gap-2">
                {p.kycStatus === "PENDING" && (
                  <>
                    <button
                      type="button"
                      disabled={busyId != null || !p.isComplete}
                      onClick={() => handleAction(p.id, "approve")}
                      className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
                    >
                      {busyId === `approve-${p.id}` ? "…" : "Approuver"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId != null}
                      onClick={() => handleAction(p.id, "reject")}
                      className="text-sm border border-red-200 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50"
                    >
                      {busyId === `reject-${p.id}` ? "…" : "Refuser"}
                    </button>
                  </>
                )}
                {p.kycStatus === "APPROVED" && (
                  <button
                    type="button"
                    disabled={busyId != null}
                    onClick={() => handleAction(p.id, "reject")}
                    className="text-sm border border-red-200 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50"
                  >
                    {busyId === `reject-${p.id}` ? "…" : "Révoquer la vérification"}
                  </button>
                )}
                {p.kycStatus === "NOT_STARTED" && p.isComplete && (
                  <button
                    type="button"
                    disabled={busyId != null}
                    onClick={() => handleAction(p.id, "approve")}
                    className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
                  >
                    {busyId === `approve-${p.id}` ? "…" : "Approuver manuellement"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-brand-600 text-sm">{success}</p>}
    </div>
  );
}
