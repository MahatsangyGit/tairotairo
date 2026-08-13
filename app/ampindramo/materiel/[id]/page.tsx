"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type EligibleBooking = {
  id: string;
  title: string;
  date: string | null;
  dateLabel: string;
  status: string;
  statusLabel: string;
  clientName: string;
};

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, authChecked } = useAuth();
  const [item, setItem] = useState<Equipment | null>(null);
  const [eligible, setEligible] = useState<EligibleBooking[] | null>(null);
  const [eligibleError, setEligibleError] = useState<string | null>(null);
  const [serviceBookingId, setServiceBookingId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadEquipment = useCallback(async () => {
    try {
      const data = await apiFetchJson<Equipment>(`/api/rental/equipment/${id}`);
      setItem(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }, [id]);

  const loadEligible = useCallback(async () => {
    if (!user || user.role !== "PROVIDER") {
      setEligible([]);
      setEligibleError(null);
      return;
    }
    try {
      const data = await apiFetchJson<{ bookings: EligibleBooking[] }>(
        "/api/rental/eligible-service-bookings"
      );
      setEligible(data.bookings);
      setEligibleError(null);
    } catch (e) {
      setEligible([]);
      setEligibleError(
        e instanceof Error
          ? e.message
          : "Impossible de charger vos prestations confirmées."
      );
    }
  }, [user]);

  useEffect(() => {
    // Fetch on mount / dependency change
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client data load
    void loadEquipment();
  }, [loadEquipment]);

  useEffect(() => {
    if (!authChecked) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client data load
    void loadEligible();
  }, [authChecked, loadEligible]);

  const selected = useMemo(
    () => eligible?.find((b) => b.id === serviceBookingId) ?? null,
    [eligible, serviceBookingId]
  );

  const isOwnEquipment = Boolean(user && item && item.ownerId === user.id);

  async function requestRental(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push(`/auth/login?callbackUrl=/ampindramo/materiel/${id}`);
      return;
    }
    if (!serviceBookingId) {
      setError("Choisissez la prestation confirmée liée à cette location.");
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
            serviceBookingId,
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

      <section className="rounded-xl border border-border p-4 sm:p-6">
        <h2 className="mb-2 text-lg font-semibold">Demander une location</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          La location est liée à une de vos prestations confirmées. La date
          du prêt est automatiquement celle de la prestation.
        </p>

        {isOwnEquipment ? (
          <p className="text-sm text-muted-foreground">
            Vous ne pouvez pas louer votre propre matériel.
          </p>
        ) : !authChecked ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : !user ? (
          <Button
            type="button"
            onClick={() =>
              router.push(`/auth/login?callbackUrl=/ampindramo/materiel/${id}`)
            }
          >
            Se connecter pour louer
          </Button>
        ) : user.role !== "PROVIDER" ? (
          <p className="text-sm text-muted-foreground">
            Seuls les prestataires peuvent emprunter du matériel, à partir
            d&apos;une réservation de prestation acceptée, payée, en cours ou
            en finition.
          </p>
        ) : eligible === null ? (
          <p className="text-muted-foreground">
            Chargement de vos prestations…
          </p>
        ) : eligibleError ? (
          <p className="text-sm text-destructive">{eligibleError}</p>
        ) : eligible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune prestation éligible pour le moment. Pour louer, vous devez
            avoir une réservation confirmée (acceptée, payée, en cours ou en
            finition) avec une date de prestation déjà fixée.
          </p>
        ) : (
          <form onSubmit={requestRental}>
            <label className="mb-4 block text-sm">
              Prestation confirmée
              <select
                required
                value={serviceBookingId}
                onChange={(e) => setServiceBookingId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value="">Choisir une prestation…</option>
                {eligible.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} — {b.dateLabel} ({b.statusLabel})
                  </option>
                ))}
              </select>
            </label>

            <div className="mb-4 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <p className="text-muted-foreground">Date de location</p>
              <p className="font-medium">
                {selected
                  ? selected.dateLabel
                  : "Sélectionnez une prestation pour afficher la date"}
              </p>
            </div>

            {error ? (
              <p className="mb-3 text-sm text-destructive">{error}</p>
            ) : null}
            <Button type="submit" disabled={submitting || !serviceBookingId}>
              {submitting ? "Envoi…" : "Envoyer la demande"}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
