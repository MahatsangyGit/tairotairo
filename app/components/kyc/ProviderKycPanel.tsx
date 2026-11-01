"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatFileSize,
  type KycDocumentMeta,
  documentTypeLabel,
  type KycStatusPayload,
} from "@/lib/kyc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusAlert } from "@/components/ui/status-alert";

const ACCEPT = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";
const CIN_SLOTS = [1, 2] as const;

function formatLongDateFr(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-MG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ProviderKycPanel() {
  const [kyc, setKyc] = useState<KycStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KycDocumentMeta | null>(null);

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

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
    setUploading(`CIN-${cinSlot}`);
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
    if (file) void uploadFile(file, cinSlot);
  };

  const deleteDocument = async (doc: KycDocumentMeta) => {
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
      setDeleteTarget(null);
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

  if (loading) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Chargement de la vérification…
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vérification d&apos;identité (KYC)</CardTitle>
        <CardDescription>
          Obligatoire pour publier des annonces et répondre aux demandes. Formats :
          JPEG, PNG, PDF — max 2 Mo par fichier.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {kyc?.status === "PENDING" && (
          <StatusAlert
            variant="info"
            className="border-amber-100 bg-amber-50 text-amber-900"
          >
            Dossier en cours de vérification par notre équipe.
            {kyc.submittedAt && (
              <span className="text-amber-700 block text-xs mt-1">
                Envoyé le {formatLongDateFr(kyc.submittedAt)}
              </span>
            )}
          </StatusAlert>
        )}

        {kyc?.status === "APPROVED" && (
          <StatusAlert variant="success">
            Identité vérifiée
            {kyc.submittedAt && (
              <span className="block text-xs mt-1 opacity-80">
                Validée le {formatLongDateFr(kyc.submittedAt)}
              </span>
            )}
          </StatusAlert>
        )}

        <div className="border border-border rounded-xl p-4 max-w-lg">
          <h3 className="text-sm font-medium mb-1">
            Carte d&apos;identité (CIN) *
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            1 fichier minimum, 2 maximum (recto / verso).
          </p>
          <div className="flex flex-col gap-2">
            {CIN_SLOTS.map((slot) => {
              const hasDoc = cinDocs.some((d) => d.cinSlot === slot);
              const isUploading = uploading === `CIN-${slot}`;
              const label = isUploading
                ? "Envoi…"
                : hasDoc
                  ? `Remplacer CIN (fichier ${slot})`
                  : slot === 1
                    ? "Ajouter CIN (fichier 1)"
                    : "Ajouter CIN (fichier 2 — optionnel)";

              return (
                <div key={slot}>
                  <input
                    ref={(el) => {
                      fileInputRefs.current[slot] = el;
                    }}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => handleFileChange(slot, e)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={uploading != null || cinDocs.length >= 2}
                    onClick={() => fileInputRefs.current[slot]?.click()}
                  >
                    {label}
                  </Button>
                </div>
              );
            })}
          </div>
          {cinDocs.length > 0 && (
            <ul className="mt-3">
              {cinDocs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {documentTypeLabel(doc.type, doc.cinSlot)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.originalName} · {formatFileSize(doc.sizeBytes)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="link" size="xs" asChild className="px-0">
                      <a
                        href={`/api/provider/kyc/documents/${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Voir
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="xs"
                      onClick={() => setDeleteTarget(doc)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {kyc?.status !== "APPROVED" && kyc?.status !== "PENDING" && (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!kyc?.isComplete || submitting}
            className="w-fit"
          >
            {submitting ? "Envoi…" : "Envoyer pour vérification"}
          </Button>
        )}

        {kyc?.status === "APPROVED" && (
          <p className="text-xs text-muted-foreground">
            Tout nouvel envoi ou remplacement de document réinitialise la
            vérification : validez à nouveau pour réactiver vos annonces.
          </p>
        )}

        {error && <StatusAlert variant="error">{error}</StatusAlert>}
        {success && <StatusAlert variant="success">{success}</StatusAlert>}
      </CardContent>

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Supprimer le document"
        description={
          deleteTarget ? `Supprimer « ${deleteTarget.originalName} » ?` : ""
        }
        confirmLabel="Supprimer"
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteDocument(deleteTarget);
        }}
      />
    </Card>
  );
}
