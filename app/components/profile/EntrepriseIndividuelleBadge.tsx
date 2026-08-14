"use client";

import { cn } from "@/lib/utils";

export default function EntrepriseIndividuelleBadge({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      title="Entreprise individuelle"
      aria-label="Entreprise individuelle"
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white dark:bg-slate-200 dark:text-slate-900",
        className
      )}
    >
      EI
    </span>
  );
}
