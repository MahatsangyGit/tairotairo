"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchJson } from "@/lib/api-client";
import { EQUIPMENT_CATEGORIES } from "@/lib/schemas/rental";
import { EQUIPMENT_CATEGORY_LABELS } from "@/lib/rental/equipment";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";

export default function PublishEquipmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof EQUIPMENT_CATEGORIES)[number]>("POWER_TOOLS");
  const [location, setLocation] = useState("");
  const [dailyPrice, setDailyPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
          depositAmount: Number(depositAmount),
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
            Caution (Ar)
            <input
              required
              type="number"
              min={0}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
        </div>
        <label className="block text-sm">
          Photo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
          />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Envoi…" : "Soumettre pour validation"}
        </Button>
      </form>
    </div>
  );
}
