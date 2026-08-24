"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetchJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import RentalCommissionHint from "@/components/economy/RentalCommissionHint";
import { RENTAL_PARTICULAR_COMMISSION_RATE } from "@/lib/economy";

type Rental = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  depositAmount: number;
  displayTitle: string | null;
  renterId: string;
  ownerId: string;
  commissionRate: number;
  commissionAmount: number;
  platformOwned: boolean;
  transaction: {
    id: string;
    status: string;
    amount: number;
    depositAmount: number;
  } | null;
  serviceBooking: {
    id: string;
    status: string;
    title: string | null;
    date: string | null;
    dateLabel: string;
  } | null;
};

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Demandée",
  ACCEPTED: "Acceptée — en attente de paiement",
  PAID: "Payée (séquestre)",
  ONGOING: "En cours",
  RETURN_PENDING: "Retour en attente",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  DISPUTED: "Litige",
};

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [rental, setRental] = useState<Rental | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetchJson<Rental>(`/api/rental/bookings/${id}`);
      setRental(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }, [id]);

  useEffect(() => {
    // Fetch on mount / dependency change
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client data load
    void load();
  }, [load]);

  async function patchStatus(status: string) {
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetchJson<Rental>(`/api/rental/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setRental(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetchJson<Rental>(
        `/api/rental/bookings/${id}/pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethod: "MVOLA" }),
        }
      );
      setRental(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (!rental && !error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-muted-foreground">
        Chargement…
      </div>
    );
  }
  if (!rental) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-destructive">{error}</div>
    );
  }

  const isRenter = user?.id === rental.renterId;
  const isOwner = user?.id === rental.ownerId;
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold">
        {rental.displayTitle || "Location"}
      </h1>
      <p className="mb-1 text-muted-foreground">
        {STATUS_LABELS[rental.status] ?? rental.status}
      </p>
      <p className="mb-6 text-sm text-muted-foreground">
        {new Date(rental.startDate).toLocaleDateString("fr-MG")} →{" "}
        {new Date(rental.endDate).toLocaleDateString("fr-MG")}
      </p>
      {rental.serviceBooking ? (
        <p className="mb-6 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          Prestation liée :{" "}
          <strong>
            {rental.serviceBooking.title || "Réservation"}
          </strong>
          <span className="text-muted-foreground">
            {" "}
            · {rental.serviceBooking.dateLabel}
          </span>
        </p>
      ) : null}
      <div className="mb-6 rounded-xl border border-border p-4">
        <p>
          Loyer :{" "}
          <strong>{rental.totalAmount.toLocaleString("fr-MG")} Ar</strong>
        </p>
        {rental.depositAmount > 0 ? (
          <p>
            Caution :{" "}
            <strong>{rental.depositAmount.toLocaleString("fr-MG")} Ar</strong>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Pas de caution</p>
        )}
        {isOwner ? (
          <div className="mt-3">
            <RentalCommissionHint
              isPlatformOwned={rental.platformOwned}
              ownerIsProfessionalClient={
                !rental.platformOwned &&
                rental.commissionRate !== RENTAL_PARTICULAR_COMMISSION_RATE
              }
              totalAmount={rental.totalAmount}
              frozenRate={rental.commissionRate}
            />
          </div>
        ) : null}
        {rental.transaction ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Transaction : {rental.transaction.status}
          </p>
        ) : null}
      </div>

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {rental.status === "REQUESTED" && (isOwner || isAdmin) ? (
          <Button disabled={busy} onClick={() => patchStatus("ACCEPTED")}>
            Accepter
          </Button>
        ) : null}
        {rental.status === "ACCEPTED" && (isRenter || isAdmin) ? (
          <Button disabled={busy} onClick={() => pay()}>
            Payer (simulé MVola)
          </Button>
        ) : null}
        {rental.status === "PAID" && (isOwner || isAdmin) ? (
          <Button disabled={busy} onClick={() => patchStatus("ONGOING")}>
            Remise du matériel
          </Button>
        ) : null}
        {rental.status === "ONGOING" && (isRenter || isOwner || isAdmin) ? (
          <Button
            disabled={busy}
            onClick={() => patchStatus("RETURN_PENDING")}
          >
            Signaler le retour
          </Button>
        ) : null}
        {rental.status === "RETURN_PENDING" && (isOwner || isAdmin) ? (
          <Button disabled={busy} onClick={() => patchStatus("COMPLETED")}>
            Valider et clôturer
          </Button>
        ) : null}
        {["REQUESTED", "ACCEPTED"].includes(rental.status) ? (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => patchStatus("CANCELLED")}
          >
            Annuler
          </Button>
        ) : null}
        {["PAID", "ONGOING", "RETURN_PENDING"].includes(rental.status) ? (
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => patchStatus("DISPUTED")}
          >
            Ouvrir un litige
          </Button>
        ) : null}
      </div>
    </div>
  );
}
