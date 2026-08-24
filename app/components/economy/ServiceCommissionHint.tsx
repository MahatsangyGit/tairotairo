"use client";

import {
  formatCommissionPercent,
  formatMgaAmount,
  serviceCommissionRate,
  splitAmount,
} from "@/lib/economy";

export default function ServiceCommissionHint({
  category,
  price,
}: {
  category: string;
  price?: number;
}) {
  const rate = serviceCommissionRate(category);
  const amount = Number.isFinite(price) && (price ?? 0) > 0 ? (price as number) : null;
  const split = amount != null ? splitAmount(amount, rate) : null;

  return (
    <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted/40 px-3 py-2">
      Commission Tairo {formatCommissionPercent(rate)}
      {split ? (
        <>
          {" "}
          — vous recevrez{" "}
          <span className="font-medium text-foreground">
            {formatMgaAmount(split.net)}
          </span>
          {" "}
          (brut {formatMgaAmount(split.gross)}).
        </>
      ) : (
        <> sur le prix final de chaque réservation.</>
      )}
    </p>
  );
}
