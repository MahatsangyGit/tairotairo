import { ApiClientError } from "@/lib/api-client";

/** Message d’erreur UI, ou `null` si 401 (redirection déjà gérée). */
export function messageFromApiAction(err: unknown): string | null {
  if (err instanceof ApiClientError) {
    if (err.status === 401) return null;
    return err.message;
  }
  return "Une erreur est survenue";
}
