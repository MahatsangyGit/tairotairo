/** Déclenche un rafraîchissement de session dans AuthProvider. */
export function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-changed"));
  }
}
