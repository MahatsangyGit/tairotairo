import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatusAlertProps {
  variant: "success" | "error" | "info";
  children: ReactNode;
  className?: string;
}

const variants = {
  success:
    "bg-brand-50 border-brand-100 text-brand-800 dark:bg-brand-900/30 dark:border-brand-800/50 dark:text-brand-200",
  error: "bg-destructive/10 border-destructive/20 text-destructive",
  info: "bg-muted border-border text-muted-foreground",
};

export function StatusAlert({ variant, children, className }: StatusAlertProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
