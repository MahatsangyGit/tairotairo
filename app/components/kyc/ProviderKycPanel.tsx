"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatFileSize,
  type KycDocumentMeta,
  documentTypeLabel,
  type KycStatusPayload,
} from "@/lib/kyc";

const ACCEPT = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";

export default function ProviderKycPanel() {
  const [kyc, setKyc] = useState<KycStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cin1Ref = useRef<HTMLInputElement>(null);
  const cin2Ref = useRef<HTMLInputElement>(null);

  const fetchKyc = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/provider/kyc");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur de chargement");
        return;
      }
      setKyc(data.kyc);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKyc();
  }, [fetchKyc]);

  const cinDocs = kyc?.documents.filter((d) => d.type === "CIN") ?? [];

  const uploadFile = async (file: File, cinSlot: number) => {
    const key = `CIN-${cinSlot}`;
    setUploading(key);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.set("type", "CIN");
    formData.set("file", file);
    formData.set("cinSlot", String(cinSlot));

    try {
      const res = await fetch("/api/provider/kyc/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Envoi impossible");
        return;
      }
      setKyc(data.kyc);
      setSuccess(data.message ?? "Document enregistré");
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setUploading(null);
    }
  };

  const handleFileChange = (
    cinSlot: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void uploadFile(file, cinSlot);
  };

  const deleteDocument = async (doc: KycDocumentMeta) => {
    if (!confirm(`Supprimer « ${doc.originalName} » ?`)) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/provider/kyc/documents/${doc.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Suppression impossible");
        return;
      }
      setKyc(data.kyc);
      setSuccess("Document supprimé");
    } catch {
      setError("Une erreur est survenue");
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/provider/kyc/submit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Validation impossible");
        return;
      }
      setKyc(data.kyc);
      setSuccess(data.message);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const renderDocRow = (doc: KycDocumentMeta) => (
    <li
      key={doc.id}
      className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {documentTypeLabel(doc.type, doc.cinSlot)}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {doc.originalName} · {formatFileSize(doc.sizeBytes)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={`/api/provider/kyc/documents/${doc.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-600 hover:underline"
        >
          Voir
        </a>
        <button
          type="button"
          onClick={() => deleteDocument(doc)}
          className="text-xs text-red-600 hover:underline"
        >
          Supprimer
        </button>
      </div>
    </li>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-gray-500 text-sm">Chargement de la vérification…</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
      <div>
        <h2 className="font-semibold text-gray-800">Vérification d&apos;identité (KYC)</h2>
        <p className="text-sm text-gray-500 mt-1">
          Obligatoire pour publier des annonces et répondre aux demandes. Formats :
          JPEG, PNG, PDF — max 2 Mo par fichier.
        </p>
      </div>

      {kyc?.status === "PENDING" && (
        <div className="bg-amber-50 border border-amber-100 text-amber-900 text-sm rounded-lg px-4 py-3">
          Dossier en cours de vérification par notre équipe.
          {kyc.submittedAt && (
            <span className="text-amber-700 block text-xs mt-1">
              Envoyé le{" "}
              {new Date(kyc.submittedAt).toLocaleDateString("fr-MG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      )}

      {kyc?.status === "APPROVED" && (
        <div className="bg-brand-50 border border-brand-100 text-brand-800 text-sm rounded-lg px-4 py-3">
          Identité vérifiée
          {kyc.submittedAt && (
            <span className="text-brand-600 block text-xs mt-1">
              Validée le{" "}
              {new Date(kyc.submittedAt).toLocaleDateString("fr-MG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      )}

      <div className="border border-gray-100 rounded-xl p-4 max-w-lg">
        <h3 className="text-sm font-medium text-gray-800 mb-1">
          Carte d&apos;identité (CIN) *
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          1 fichier minimum, 2 maximum (recto / verso).
        </p>
        <div className="flex flex-col gap-2">
          <input
            ref={cin1Ref}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => handleFileChange(1, e)}
          />
          <input
            ref={cin2Ref}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => handleFileChange(2, e)}
          />
          <button
            type="button"
            disabled={uploading != null || cinDocs.length >= 2}
            onClick={() => cin1Ref.current?.click()}
            className="text-sm border border-brand-200 text-brand-700 px-3 py-2 rounded-lg hover:bg-brand-50 disabled:opacity-50"
          >
            {uploading === "CIN-1"
              ? "Envoi…"
              : cinDocs.some((d) => d.cinSlot === 1)
                ? "Remplacer CIN (fichier 1)"
                : "Ajouter CIN (fichier 1)"}
          </button>
          <button
            type="button"
            disabled={uploading != null || cinDocs.length >= 2}
            onClick={() => cin2Ref.current?.click()}
            className="text-sm border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading === "CIN-2"
              ? "Envoi…"
              : cinDocs.some((d) => d.cinSlot === 2)
                ? "Remplacer CIN (fichier 2)"
                : "Ajouter CIN (fichier 2 — optionnel)"}
          </button>
        </div>
        {cinDocs.length > 0 && (
          <ul className="mt-3">{cinDocs.map(renderDocRow)}</ul>
        )}
      </div>

      {kyc?.status !== "APPROVED" && kyc?.status !== "PENDING" && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!kyc?.isComplete || submitting}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 w-fit"
        >
          {submitting ? "Envoi…" : "Envoyer pour vérification"}
        </button>
      )}

      {kyc?.status === "APPROVED" && (
        <p className="text-xs text-gray-500">
          Tout nouvel envoi ou remplacement de document réinitialise la
          vérification : validez à nouveau pour réactiver vos annonces.
        </p>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-brand-700 text-sm">{success}</p>}
    </div>
  );
}
