"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetchJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

type Rental = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  depositAmount: number;
  displayTitle: string | null;
  equipment: { id: string; title: string; photoUrl: string | null } | null;
};

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Demandée",
  ACCEPTED: "Acceptée",
  PAID: "Payée",
  ONGOING: "En cours",
  RETURN_PENDING: "Retour en attente",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  DISPUTED: "Litige",
};

export default function MyRentalsPage() {
  const [as, setAs] = useState<"renter" | "owner">("renter");
  const [bookings, setBookings] = useState<Rental[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetchJson<{ bookings: Rental[] }>(
        `/api/rental/bookings?as=${as}`
      );
      setBookings(data.bookings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [as]);

  useEffect(() => {
    // Fetch on mount / dependency change
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client data load
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold">Mes locations</h1>
      <div className="mb-6 flex gap-2">
        <Button
          variant={as === "renter" ? "default" : "outline"}
          onClick={() => setAs("renter")}
        >
          Emprunts
        </Button>
        <Button
          variant={as === "owner" ? "default" : "outline"}
          onClick={() => setAs("owner")}
        >
          Prêts
        </Button>
      </div>
      {error ? <p className="text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : bookings.length === 0 ? (
        <p className="text-muted-foreground">Aucune location.</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/ampindramo/mes-locations/${b.id}`}
                className="flex items-center justify-between rounded-xl border border-border p-4 hover:border-brand-500"
              >
                <div>
                  <p className="font-semibold">
                    {b.displayTitle || b.equipment?.title || "Location"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(b.startDate).toLocaleDateString("fr-MG")} →{" "}
                    {new Date(b.endDate).toLocaleDateString("fr-MG")} ·{" "}
                    {STATUS_LABELS[b.status] ?? b.status}
                  </p>
                </div>
                <p className="text-sm font-medium">
                  {b.totalAmount.toLocaleString("fr-MG")} Ar
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
