"use client";

import { useCallback, useEffect, useState } from "react";
import {
  documentTypeLabel,
  formatFileSize,
  kycStatusLabel,
  type KycDocumentType,
} from "@/lib/kyc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusAlert } from "@/components/ui/status-alert";

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

type PendingAction = {
  providerId: string;
  action: "approve" | "reject";
};

function KycStatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") {
    return <Badge variant="default">{kycStatusLabel(status)}</Badge>;
  }
  if (status === "PENDING") {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
        {kycStatusLabel(status)}
      </Badge>
    );
  }
  return <Badge variant="secondary">{kycStatusLabel(status)}</Badge>;
}

export default function AdminKycPanel() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [providers, setProviders] = useState<ProviderKycRow[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, incomplete: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

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

  const runAction = async (providerId: string, action: "approve" | "reject") => {
    const label = action === "approve" ? "approuver" : "refuser";
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
      setPendingAction(null);
      await load();
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setBusyId(null);
    }
  };

  const confirmTitle =
    pendingAction?.action === "approve"
      ? "Approuver l'identité"
      : pendingAction?.action === "reject"
        ? "Refuser le dossier KYC"
        : "";

  const confirmDescription =
    pendingAction?.action === "approve"
      ? "Approuver l'identité de ce prestataire ?"
      : pendingAction?.action === "reject"
        ? "Refuser ce dossier KYC ? Le prestataire devra soumettre à nouveau."
        : "";

  return (
    <div className="flex flex-col gap-6">
      <StatusAlert variant="info">
        Vérifiez les documents CIN des prestataires et validez ou refusez leur
        identité. Un prestataire approuvé peut publier des annonces et répondre aux
        demandes.
      </StatusAlert>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            type="button"
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            {f.id === "pending" && counts.pending > 0 && (
              <Badge variant="secondary" className="ml-1.5 bg-amber-400 text-amber-900">
                {counts.pending}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>{counts.pending} en attente</span>
        <span>{counts.approved} approuvés</span>
        <span>{counts.incomplete} dossiers incomplets</span>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Chargement…</p>}

      {!loading && providers.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Aucun dossier dans cette catégorie</p>
          </CardContent>
        </Card>
      )}

      {!loading && providers.length > 0 && (
        <div className="flex flex-col gap-4">
          {providers.map((p) => (
            <Card key={p.id}>
              <CardHeader className="border-b flex-row flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle>{p.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{p.email}</p>
                  {p.phone && (
                    <p className="text-xs text-muted-foreground mt-0.5">{p.phone}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <KycStatusBadge status={p.kycStatus} />
                  {p.kycSubmittedAt && (
                    <span className="text-xs text-muted-foreground">
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
              </CardHeader>

              <CardContent className="pt-6">
                {p.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun document</p>
                ) : (
                  <ul className="space-y-2">
                    {p.documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {documentTypeLabel(doc.type, doc.cinSlot)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.originalName} · {formatFileSize(doc.sizeBytes)}
                          </p>
                        </div>
                        <Button variant="link" size="sm" asChild className="shrink-0 px-0">
                          <a
                            href={`/api/provider/kyc/documents/${doc.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Voir le document →
                          </a>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                {!p.isComplete && p.documents.length > 0 && (
                  <p className="text-xs text-amber-700 mt-3">
                    Dossier incomplet (CIN manquante ou invalide)
                  </p>
                )}
              </CardContent>

              <CardFooter className="border-t bg-muted/30 flex flex-wrap gap-2">
                {p.kycStatus === "PENDING" && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyId != null || !p.isComplete}
                      onClick={() =>
                        setPendingAction({ providerId: p.id, action: "approve" })
                      }
                    >
                      {busyId === `approve-${p.id}` ? "…" : "Approuver"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={busyId != null}
                      onClick={() =>
                        setPendingAction({ providerId: p.id, action: "reject" })
                      }
                    >
                      {busyId === `reject-${p.id}` ? "…" : "Refuser"}
                    </Button>
                  </>
                )}
                {p.kycStatus === "APPROVED" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={busyId != null}
                    onClick={() =>
                      setPendingAction({ providerId: p.id, action: "reject" })
                    }
                  >
                    {busyId === `reject-${p.id}` ? "…" : "Révoquer la vérification"}
                  </Button>
                )}
                {p.kycStatus === "NOT_STARTED" && p.isComplete && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={busyId != null}
                    onClick={() =>
                      setPendingAction({ providerId: p.id, action: "approve" })
                    }
                  >
                    {busyId === `approve-${p.id}` ? "…" : "Approuver manuellement"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {error && <StatusAlert variant="error">{error}</StatusAlert>}
      {success && <StatusAlert variant="success">{success}</StatusAlert>}

      <ConfirmDialog
        open={pendingAction != null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={pendingAction?.action === "approve" ? "Approuver" : "Refuser"}
        destructive={pendingAction?.action === "reject"}
        loading={busyId != null}
        onConfirm={() => {
          if (pendingAction) {
            runAction(pendingAction.providerId, pendingAction.action);
          }
        }}
      />
    </div>
  );
}
