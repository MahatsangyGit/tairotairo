export const AVATAR_MAX_FILE_BYTES = 2 * 1024 * 1024;

export const AVATAR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AvatarAllowedMime = (typeof AVATAR_ALLOWED_MIME_TYPES)[number];

export const AVATAR_ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

/** URL publique servie par l'API (fichier local). */
export function buildAvatarApiPath(userId: string, cacheBust?: number): string {
  const base = `/api/users/${userId}/avatar`;
  return cacheBust ? `${base}?v=${cacheBust}` : base;
}

export function isLocalAvatarUrl(avatar: string | null | undefined): boolean {
  return !!avatar && avatar.startsWith("/api/users/") && avatar.includes("/avatar");
}
