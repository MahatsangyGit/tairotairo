"use client";

import { formatCommissionPercent, formatMgaAmount, splitAmount } from "@/lib/economy";
import { cn } from "@/lib/utils";

export default function CommissionBreakdown({
  rate,
  gross,
  tariffLabel = "Tarif affiché",
  emptyHint = "Saisissez un tarif pour voir le montant prélevé.",
  className,
  variant = "default",
  tone = "default",
}: {
  rate: number;
  gross?: number | null;
  tariffLabel?: string;
  emptyHint?: string;
  className?: string;
  variant?: "default" | "compact";
  tone?: "default" | "onAccent" | "onSoft";
}) {
  const amount = typeof gross === "number" && Number.isFinite(gross) && gross > 0 ? gross : null;
  const split = amount != null ? splitAmount(amount, rate) : null;
  const pct = formatCommissionPercent(rate);

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "text-xs leading-snug",
          tone === "onAccent"
            ? "text-amber-100/90"
            : tone === "onSoft"
              ? "text-amber-800 dark:text-amber-200"
              : "text-muted-foreground",
          className
        )}
        aria-live="polite"
      >
        {split ? (
          <p>
            Montant prélevé {formatMgaAmount(split.commissionAmount)} ({pct})
            <span className="block">
              Vous recevrez {formatMgaAmount(split.net)}
            </span>
          </p>
        ) : (
          <p>
            Commission Tairo {pct}. {emptyHint}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "text-sm rounded-lg border border-border bg-muted/40 px-3 py-2.5",
        className
      )}
      aria-live="polite"
    >
      <p className="font-medium text-foreground">
        Commission Tairo {pct}
      </p>
      {split ? (
        <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">{tariffLabel}</dt>
          <dd className="text-right font-medium text-foreground">
            {formatMgaAmount(split.gross)}
          </dd>
          <dt className="text-muted-foreground">Montant prélevé</dt>
          <dd className="text-right font-medium text-amber-800 dark:text-amber-300">
            {formatMgaAmount(split.commissionAmount)}
          </dd>
          <dt className="font-medium text-foreground">Vous recevrez</dt>
          <dd className="text-right font-semibold text-brand-700 dark:text-brand-300">
            {formatMgaAmount(split.net)}
          </dd>
        </dl>
      ) : (
        <p className="mt-1 text-muted-foreground">{emptyHint}</p>
      )}
    </div>
  );
}
