export const LISTING_COVER_MAX_FILE_BYTES = 3 * 1024 * 1024;

export type ListingCoverKind = "service" | "request";

export function buildListingCoverUrl(
  kind: ListingCoverKind,
  id: string,
  cacheBust?: number
): string {
  const base =
    kind === "service"
      ? `/api/services/${id}/cover`
      : `/api/requests/${id}/cover`;
  return cacheBust ? `${base}?v=${cacheBust}` : base;
}

export function withCoverImageUrl<
  T extends { id: string; coverImageMime: string | null },
>(kind: ListingCoverKind, item: T) {
  return {
    ...item,
    coverImageUrl: item.coverImageMime
      ? buildListingCoverUrl(kind, item.id)
      : null,
  };
}
