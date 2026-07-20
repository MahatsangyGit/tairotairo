"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetchJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";

type Equipment = {
  id: string;
  title: string;
  description: string;
  categoryLabel: string;
  location: string;
  dailyPrice: number;
  depositAmount: number;
  photoUrl: string | null;
  ownerId: string;
  isPlatformOwned: boolean;
};

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState<Equipment | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetchJson<Equipment>(`/api/rental/equipment/${id}`);
      setItem(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }, [id]);

  useEffect(() => {
    // Fetch on mount / dependency change
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client data load
    void load();
  }, [load]);

  async function requestRental(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push(`/auth/login?callbackUrl=/ampindramo/materiel/${id}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const rental = await apiFetchJson<{ id: string }>(
        "/api/rental/bookings",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            equipmentId: id,
            startDate,
            endDate,
          }),
        }
      );
      router.push(`/ampindramo/mes-locations/${rental.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  if (!item && !error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 overflow-hidden rounded-xl border border-border">
        <div className="aspect-video bg-muted">
          {item.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.photoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
      </div>
      <p className="mb-1 text-sm text-muted-foreground">
        {item.categoryLabel} · {item.location}
        {item.isPlatformOwned ? " · Catalogue Tairo" : ""}
      </p>
      <h1 className="mb-4 text-3xl font-bold">{item.title}</h1>
      <p className="mb-6 whitespace-pre-wrap text-muted-foreground">
        {item.description}
      </p>
      <p className="mb-8 text-lg font-semibold">
        {item.dailyPrice.toLocaleString("fr-MG")} Ar / jour
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          Caution {item.depositAmount.toLocaleString("fr-MG")} Ar
        </span>
      </p>

      <form
        onSubmit={requestRental}
        className="rounded-xl border border-border p-4 sm:p-6"
      >
        <h2 className="mb-4 text-lg font-semibold">Demander une location</h2>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Début
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Fin
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
        </div>
        {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Envoi…" : "Envoyer la demande"}
        </Button>
      </form>
    </div>
  );
}
