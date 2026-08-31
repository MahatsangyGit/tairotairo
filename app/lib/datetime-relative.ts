/** Relative French time for public feeds (reviews, activity). */
export function formatRelativeFr(date: Date, now = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return "à l’instant";
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l’instant";
  if (minutes === 1) return "il y a une minute";
  if (minutes < 60) return `il y a ${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "il y a une heure";
  if (hours < 24) return `il y a ${hours} heures`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;

  return date.toLocaleDateString("fr-MG");
}
