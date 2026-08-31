import { cdnPath } from "@/lib/cdn";

export const LISTING_COVER_MAX_FILE_BYTES = 3 * 1024 * 1024;

export type ListingKind = "service" | "request";
export type ListingCoverKind = ListingKind;

export function buildListingCoverUrl(
  kind: ListingCoverKind,
  id: string,
  cacheBust?: number
): string {
  const base =
    kind === "service"
      ? `/api/services/${id}/cover`
      : `/api/requests/${id}/cover`;
  const path = cacheBust ? `${base}?v=${cacheBust}` : base;
  return cdnPath(path);
}

export function withCoverImageUrl<
  T extends {
    id: string;
    coverImageMime: string | null;
    updatedAt?: Date | string;
  },
>(kind: ListingCoverKind, item: T) {
  const version = item.updatedAt
    ? new Date(item.updatedAt).getTime()
    : undefined;

  return {
    ...item,
    coverImageUrl: item.coverImageMime
      ? buildListingCoverUrl(kind, item.id, version)
      : null,
  };
}
