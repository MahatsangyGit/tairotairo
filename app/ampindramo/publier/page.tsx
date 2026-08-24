"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchJson } from "@/lib/api-client";
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CATEGORY_LABELS,
} from "@/lib/rental/constants";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { isProfessionalClient } from "@/lib/client-kind";
import RentalCommissionHint from "@/components/economy/RentalCommissionHint";

export default function PublishEquipmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<(typeof EQUIPMENT_CATEGORIES)[number]>("POWER_TOOLS");
  const [location, setLocation] = useState("");
  const [dailyPrice, setDailyPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push("/auth/login?callbackUrl=/ampindramo/publier");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const item = await apiFetchJson<{ id: string }>("/api/rental/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          location,
          dailyPrice: Number(dailyPrice),
          depositAmount: Number(depositAmount || 0),
          submitForReview: true,
        }),
      });

      if (file) {
        const form = new FormData();
        form.append("file", file);
        await apiFetchJson(`/api/rental/equipment/${item.id}/photos`, {
          method: "POST",
          body: form,
        });
      }

      router.push(`/ampindramo/materiel/${item.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold">Publier mon matériel</h1>
      <p className="mb-8 text-muted-foreground">
        Les annonces entre particuliers passent par une validation avant
        publication.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          Titre
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Description
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Catégorie
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as (typeof EQUIPMENT_CATEGORIES)[number])
            }
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          >
            {EQUIPMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EQUIPMENT_CATEGORY_LABELS[c] ?? c}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Ville
          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Prix / jour (Ar)
            <input
              required
              type="number"
              min={0}
              value={dailyPrice}
              onChange={(e) => setDailyPrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Caution (Ar, optionnel)
            <input
              type="number"
              min={0}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
        </div>
        <RentalCommissionHint
          ownerIsProfessionalClient={isProfessionalClient(user)}
          totalAmount={Number(dailyPrice)}
          tariffLabel="Tarif / jour"
        />
        <fieldset>
          <legend className="text-sm font-medium text-foreground">Photo</legend>
          <p className="mt-1 text-xs text-muted-foreground">
            JPEG, PNG ou WebP · 3 Mo maximum
          </p>

          <label
            htmlFor="equipment-photo"
            className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-5 py-6 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/10"
          >
            <span
              className="flex size-11 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
              aria-hidden="true"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>
              <span className="inline-flex min-h-10 items-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
                Choisir une photo
              </span>
              <span className="mt-2 block text-xs text-muted-foreground">
                Sélectionnez une image depuis votre appareil
              </span>
            </span>
          </label>
          <input
            ref={fileInputRef}
            id="equipment-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              if (selected && selected.size > 3 * 1024 * 1024) {
                setFile(null);
                setError("Photo trop volumineuse (3 Mo maximum).");
                event.target.value = "";
                return;
              }
              setError(null);
              setFile(selected);
            }}
            className="sr-only"
          />

          {file ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 dark:border-brand-800 dark:bg-brand-900/20">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} Mo · prête à envoyer
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
              >
                Retirer
              </button>
            </div>
          ) : null}
        </fieldset>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Envoi…" : "Soumettre pour validation"}
        </Button>
      </form>
    </div>
  );
}
