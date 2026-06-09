import type { ListingCoverKind } from "@/lib/listing-cover";

export async function syncListingCover(
  kind: ListingCoverKind,
  entityId: string,
  options: {
    file: File | null;
    removeExisting: boolean;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const base =
    kind === "service"
      ? `/api/services/${entityId}/cover`
      : `/api/requests/${entityId}/cover`;

  if (options.removeExisting) {
    const res = await fetch(base, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error ?? "Suppression de l'image impossible" };
    }
    return { ok: true };
  }

  if (!options.file) {
    return { ok: true };
  }

  const formData = new FormData();
  formData.set("file", options.file);

  const res = await fetch(base, { method: "POST", body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error ?? "Envoi de l'image impossible" };
  }

  return { ok: true };
}
