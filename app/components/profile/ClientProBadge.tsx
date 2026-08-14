"use client";

import { cn } from "@/lib/utils";

export default function ClientProBadge({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      title="Client professionnel"
      aria-label="Client professionnel"
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-slate-300 bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white dark:border-slate-600 dark:bg-slate-100 dark:text-slate-900",
        className
      )}
    >
      Pro
    </span>
  );
}
