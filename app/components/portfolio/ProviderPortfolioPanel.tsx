"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PortfolioItemPayload } from "@/lib/portfolio";
import { PORTFOLIO_MAX_FILE_BYTES } from "@/lib/portfolio";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export default function ProviderPortfolioPanel() {
  const [items, setItems] = useState<PortfolioItemPayload[]>([]);
  const [maxItems, setMaxItems] = useState(24);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceImageRef = useRef<HTMLInputElement>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/provider/portfolio");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur de chargement");
        return;
      }
      setItems(data.items ?? []);
      setMaxItems(data.maxItems ?? 24);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = async (file: File) => {
    if (!description.trim()) {
      setError("Ajoutez une description");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.set("file", file);
    formData.set("description", description.trim());

    try {
      const res = await fetch("/api/provider/portfolio", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Ajout impossible");
        return;
      }

      setItems((prev) => [...prev, data.item]);
      setDescription("");
      setSuccess("Réalisation ajoutée au portfolio");
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setUploading(false);
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void handleAdd(file);
  };

  const runDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/portfolio/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Suppression impossible");
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      setSuccess("Réalisation supprimée");
      setDeleteTarget(null);
    } catch {
      setError("Une erreur est survenue");
    }
  };

  const startEdit = (item: PortfolioItemPayload) => {
    setEditingId(item.id);
    setEditDescription(item.description);
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/portfolio/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editDescription.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Mise à jour impossible");
        return;
      }
      setItems((prev) =>
        prev.map((i) => (i.id === id ? data.item : i))
      );
      setEditingId(null);
      setSuccess("Description mise à jour");
    } catch {
      setError("Une erreur est survenue");
    }
  };

  const handleReplaceImage = async (
    itemId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setReplaceTargetId(null);
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);

    try {
      const res = await fetch(`/api/provider/portfolio/${itemId}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Remplacement impossible");
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...data.item, imageUrl: `${data.item.imageUrl}?v=${Date.now()}` }
            : i
        )
      );
      setSuccess("Image mise à jour");
    } catch {
      setError("Une erreur est survenue");
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Image + description — JPEG, PNG ou WebP, max{" "}
        {PORTFOLIO_MAX_FILE_BYTES / (1024 * 1024)} Mo. Les clients peuvent
        commenter chaque réalisation sur votre profil public.
      </p>

      {items.length < maxItems && (
        <div className="border border-border rounded-xl p-4 flex flex-col gap-3">
          <textarea
            placeholder="Décrivez cette réalisation (visible sur le profil public)"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg resize-none focus:outline-none focus:border-brand-500 text-sm"
          />
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleFilePick}
          />
          <button
            type="button"
            disabled={uploading || !description.trim()}
            onClick={() => fileRef.current?.click()}
            className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 w-fit"
          >
            {uploading ? "Envoi…" : "Ajouter une réalisation (image)"}
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Chargement du portfolio…</p>}

      {!loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune réalisation pour le moment.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-border rounded-xl overflow-hidden"
          >
            <img
              src={item.imageUrl}
              alt=""
              className="w-full h-40 object-cover bg-gray-100"
            />
            <div className="p-3 flex flex-col gap-2">
              {editingId === item.id ? (
                <>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full text-sm px-3 py-2 border border-border rounded-lg resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(item.id)}
                      className="text-xs text-brand-600 font-medium hover:underline"
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">
                  {item.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {item.commentCount} commentaire
                {item.commentCount !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="text-xs text-brand-600 hover:underline"
                >
                  Modifier la description
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplaceTargetId(item.id);
                    replaceImageRef.current?.click();
                  }}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Changer l&apos;image
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <input
        ref={replaceImageRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          if (replaceTargetId) void handleReplaceImage(replaceTargetId, e);
        }}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-brand-600 text-sm">{success}</p>}

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Supprimer la réalisation"
        description="Supprimer cette réalisation du portfolio ?"
        confirmLabel="Supprimer"
        destructive
        onConfirm={() => {
          if (deleteTarget) runDelete(deleteTarget);
        }}
      />
    </div>
  );
}
