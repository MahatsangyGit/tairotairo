/** Délai minimum entre deux vues comptées pour le même couple user × leçon. */
export const LESSON_VIEW_COOLDOWN_MS = 6 * 60 * 60 * 1000;

export function shouldCountLessonView(
  lastViewAt: Date | null | undefined,
  now: Date = new Date(),
  cooldownMs: number = LESSON_VIEW_COOLDOWN_MS
): boolean {
  if (!lastViewAt) return true;
  return now.getTime() - lastViewAt.getTime() >= cooldownMs;
}

export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function eachUtcDayInclusive(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  );
  const end = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())
  );
  while (cursor <= end) {
    keys.push(utcDayKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

export function fillDailySeries(
  from: Date,
  to: Date,
  rows: { day: string | Date; count: number }[]
): { labels: string[]; values: number[] } {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key =
      typeof row.day === "string" ? row.day.slice(0, 10) : utcDayKey(row.day);
    map.set(key, (map.get(key) ?? 0) + row.count);
  }
  const labels = eachUtcDayInclusive(from, to);
  return {
    labels,
    values: labels.map((key) => map.get(key) ?? 0),
  };
}
