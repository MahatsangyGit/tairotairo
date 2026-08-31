"use client";

import type { BookingStatus } from "@/lib/booking-status";

export function BookingsActionError({
  message,
  variant = "client",
}: {
  message: string;
  variant?: "client" | "provider";
}) {
  if (!message) return null;
  if (variant === "provider") {
    return (
      <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
        {message}
      </p>
    );
  }
  return (
    <div className="bg-error-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
      <p className="text-error-700 text-sm">{message}</p>
    </div>
  );
}

export function BookingsListSkeleton({
  variant = "client",
}: {
  variant?: "client" | "provider";
}) {
  const bar =
    variant === "provider" ? "bg-gray-200 rounded" : "bg-neutral-100 rounded-full";
  const firstH = variant === "provider" ? "h-4" : "h-3";
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-2xl border border-border p-6 animate-pulse"
        >
          <div className={`${firstH} ${bar} w-1/4 mb-3`} />
          <div className={`h-5 ${bar} w-1/2 mb-6`} />
          <div className={`h-3 ${bar} w-full mb-2`} />
          <div className={`h-3 ${bar} w-2/3`} />
        </div>
      ))}
    </div>
  );
}

export function BookingsErrorState({
  error,
  onRetry,
  compactRetry,
}: {
  error: string;
  onRetry: () => void;
  compactRetry?: boolean;
}) {
  return (
    <div className="text-center py-20">
      <p className="text-red-500 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className={`text-brand-600 font-medium hover:underline${compactRetry ? " text-sm" : ""}`}
      >
        Réessayer
      </button>
    </div>
  );
}

export function BookingsEmptyFilter() {
  return (
    <div className="text-center py-16">
      <p className="text-muted-foreground text-sm">
        Aucune réservation dans cette catégorie
      </p>
    </div>
  );
}

export function BookingsFilterChips({
  filters,
  activeFilter,
  counts,
  onChange,
  chipClassName,
  chipPadding,
}: {
  filters: { label: string; value: BookingStatus | "ALL" }[];
  activeFilter: BookingStatus | "ALL";
  counts: Record<string, number>;
  onChange: (value: BookingStatus | "ALL") => void;
  chipClassName?: (active: boolean) => string;
  chipPadding?: string;
}) {
  const defaultClass = (active: boolean) =>
    active
      ? "bg-brand-600 text-white border-brand-600"
      : "bg-card text-muted-foreground border-neutral-200 hover:border-brand-300";

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`${chipPadding ?? "px-4 py-1.5"} rounded-full text-sm font-medium border transition-colors ${
            (chipClassName ?? defaultClass)(activeFilter === f.value)
          }`}
        >
          {f.label}
          {f.value !== "ALL" && counts[f.value] ? ` (${counts[f.value]})` : ""}
        </button>
      ))}
    </div>
  );
}
