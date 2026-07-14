/** Maximum JSON body size for API routes (1 MiB). */
export const MAX_API_BODY_BYTES = 1024 * 1024;

/**
 * Maximum multipart body for file uploads.
 * Aligné sur le plus gros upload autorisé (portfolio 5 Mo) + marge multipart.
 * En production, configurez aussi `client_max_body_size` (nginx) / équivalent
 * reverse-proxy au-dessus de cette valeur.
 */
export const MAX_UPLOAD_BODY_BYTES = 6 * 1024 * 1024;

export const PAYLOAD_TOO_LARGE_MESSAGE = "Payload trop volumineux";

/** Routes qui acceptent un fichier (multipart), donc un body plus large. */
const UPLOAD_PATH_PATTERNS: RegExp[] = [
  /^\/api\/services\/[^/]+\/cover\/?$/,
  /^\/api\/requests\/[^/]+\/cover\/?$/,
  /^\/api\/users\/me\/avatar\/?$/,
  /^\/api\/provider\/portfolio\/?$/,
  /^\/api\/provider\/portfolio\/[^/]+\/?$/,
  /^\/api\/provider\/kyc\/upload\/?$/,
];

export function isUploadApiPath(pathname: string): boolean {
  return UPLOAD_PATH_PATTERNS.some((re) => re.test(pathname));
}

export function maxBodyBytesForPath(pathname: string): number {
  return isUploadApiPath(pathname)
    ? MAX_UPLOAD_BODY_BYTES
    : MAX_API_BODY_BYTES;
}
