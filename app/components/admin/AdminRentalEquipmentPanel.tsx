"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetchJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

type Item = {
  id: string;
  title: string;
  location: string;
  dailyPrice: number;
  owner: { id: string; name: string; email?: string } | null;
};

export default function AdminRentalEquipmentPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetchJson<{ items: Item[] }>(
        "/api/admin/rental/equipment?status=PENDING_REVIEW"
      );
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }, []);

  useEffect(() => {
    // Fetch on mount / dependency change
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client data load
    void load();
  }, [load]);

  async function review(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      await apiFetchJson(`/api/admin/rental/equipment/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: action === "reject" ? "Non conforme" : undefined,
        }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">
        Validation matériel P2P (ampindramo)
      </h2>
      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
      {items.length === 0 ? (
        <p className="text-muted-foreground">Aucune annonce en attente.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.location} · {item.dailyPrice.toLocaleString("fr-MG")} Ar/j
                  {item.owner ? ` · ${item.owner.name}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={busyId === item.id}
                  onClick={() => void review(item.id, "approve")}
                >
                  Approuver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === item.id}
                  onClick={() => void review(item.id, "reject")}
                >
                  Refuser
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
