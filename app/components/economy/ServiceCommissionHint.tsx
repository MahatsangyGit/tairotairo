"use client";

import { serviceCommissionRate } from "@/lib/economy";
import CommissionBreakdown from "@/components/economy/CommissionBreakdown";

export default function ServiceCommissionHint({
  category,
  price,
  frozenRate,
  tariffLabel = "Prix de la prestation",
  className,
  variant = "default",
  tone = "default",
}: {
  category: string;
  price?: number;
  frozenRate?: number | null;
  tariffLabel?: string;
  className?: string;
  variant?: "default" | "compact";
  tone?: "default" | "onAccent" | "onSoft";
}) {
  const rate = frozenRate ?? serviceCommissionRate(category);

  return (
    <CommissionBreakdown
      rate={rate}
      gross={price}
      tariffLabel={tariffLabel}
      emptyHint="Saisissez un prix pour voir le montant prélevé automatiquement."
      className={className}
      variant={variant}
      tone={tone}
    />
  );
}
