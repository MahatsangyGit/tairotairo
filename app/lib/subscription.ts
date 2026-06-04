export const SUBSCRIPTION_PERIOD_DAYS = 30;

export type SubscriptionInfo = {
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  notes: string | null;
} | null;

export function isSubscriptionActive(
  expiresAt: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) > now;
}

export function addSubscriptionMonths(
  from: Date,
  months: number = 1
): Date {
  const end = new Date(from);
  end.setDate(end.getDate() + SUBSCRIPTION_PERIOD_DAYS * months);
  return end;
}

export function extendSubscriptionExpiry(
  currentExpiresAt: Date | null | undefined,
  months: number = 1,
  now: Date = new Date()
): Date {
  const base =
    currentExpiresAt && isSubscriptionActive(currentExpiresAt, now)
      ? new Date(currentExpiresAt)
      : now;
  return addSubscriptionMonths(base, months);
}

export function serializeSubscription(
  row: {
    startsAt: Date;
    expiresAt: Date;
    notes: string | null;
  } | null,
  now: Date = new Date()
): SubscriptionInfo {
  if (!row) return null;
  return {
    startsAt: row.startsAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    isActive: isSubscriptionActive(row.expiresAt, now),
    notes: row.notes,
  };
}
