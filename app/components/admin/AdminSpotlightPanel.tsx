"use client";

import { useCallback, useEffect, useState } from "react";
import { SUBSCRIPTION_PERIOD_DAYS } from "@/lib/subscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusAlert } from "@/components/ui/status-alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

function KycLabel({ status }: { status: string }) {
  if (status === "APPROVED") {
    return <Badge variant="default">Approuvé</Badge>;
  }
  if (status === "PENDING") {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
        En attente
      </Badge>
    );
  }
  return <Badge variant="secondary">Non validé</Badge>;
}

export default function AdminSpotlightPanel() {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

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
    setBusyId(`revoke-${providerId}`);
    setError("");
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
      setRevokeTarget(null);
      await load();
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Chargement…</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <StatusAlert variant="info">
        L&apos;<strong>abonnement mensuel actif</strong> ({SUBSCRIPTION_PERIOD_DAYS}{" "}
        jours par période) met automatiquement le prestataire en avant sur
        l&apos;accueil (si KYC approuvé), dans{" "}
        <strong>« Nos suggestions »</strong> sur la recherche, et lui permet de
        choisir une annonce à mettre en avant depuis son espace prestataire.
      </StatusAlert>

      <Card>
        <CardHeader>
          <CardTitle>Prestataires & abonnements</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prestataire</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Abonnement</TableHead>
                <TableHead>En avant</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </TableCell>
                  <TableCell>
                    <KycLabel status={p.kycStatus} />
                  </TableCell>
                  <TableCell className="text-xs">
                    {p.subscription?.isActive ? (
                      <>
                        <span className="text-primary font-medium">Actif</span>
                        <br />
                        jusqu&apos;au{" "}
                        {new Date(p.subscription.expiresAt).toLocaleDateString("fr-MG")}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Aucun / expiré</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.featuredOnHomepage ? (
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                        ★ Oui
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">Non</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        disabled={busyId != null}
                        onClick={() => grantSubscription(p.id, 1)}
                      >
                        +1 mois
                      </Button>
                      {p.subscription?.isActive && (
                        <Button
                          type="button"
                          size="xs"
                          variant="destructive"
                          disabled={busyId != null}
                          onClick={() => setRevokeTarget(p.id)}
                        >
                          Retirer abo.
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Annonces</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-6 max-h-[420px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>Annonce</TableHead>
                <TableHead>Prestataire</TableHead>
                <TableHead>Abo.</TableHead>
                <TableHead>En avant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <p className="font-medium line-clamp-1">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.category}
                      {!s.available && " · indisponible"}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.providerName}</TableCell>
                  <TableCell>
                    {s.providerSubscriptionActive ? (
                      <Badge variant="default">Actif</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.featuredOnHomepage ? (
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                        ★ Oui
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">Non</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.featuredOnHomepage
                      ? "Choix du prestataire"
                      : s.providerSubscriptionActive
                        ? "Non sélectionnée"
                        : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {error && <StatusAlert variant="error">{error}</StatusAlert>}
      {success && <StatusAlert variant="success">{success}</StatusAlert>}

      <ConfirmDialog
        open={revokeTarget != null}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        title="Retirer l'abonnement"
        description="Retirer l'abonnement et toutes les mises en avant de ce prestataire ?"
        confirmLabel="Retirer"
        destructive
        loading={busyId != null}
        onConfirm={() => {
          if (revokeTarget) revokeSubscription(revokeTarget);
        }}
      />
    </div>
  );
}
