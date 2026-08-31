"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const SUGGESTIONS = ["Plomberie", "Électricité", "Ménage", "Bricolage", "Transport"];

export default function HeroSearch({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const isDark = variant === "dark";

  const submit = (value: string) => {
    const q = value.trim();
    router.push(q ? `/services?search=${encodeURIComponent(q)}` : "/services");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(query);
      }}
      className="w-full"
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border p-1.5 pl-4 transition-colors",
          isDark
            ? "border-white/20 bg-white/10 shadow-2xl shadow-black/20 backdrop-blur-md focus-within:border-brand-300/60"
            : "border-border bg-card shadow-card focus-within:border-brand-400 focus-within:shadow-card-hover"
        )}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden="true"
          className={cn(
            "shrink-0",
            isDark ? "text-white/60" : "text-muted-foreground"
          )}
        >
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M12 12l3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un service… (ex : plombier, électricien)"
          aria-label="Rechercher un service"
          className={cn(
            "min-w-0 flex-1 bg-transparent py-2 text-sm outline-none sm:text-base",
            isDark
              ? "text-white placeholder:text-white/50"
              : "text-foreground placeholder:text-muted-foreground"
          )}
        />
        <button
          type="submit"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:scale-[0.98] sm:px-5"
        >
          Rechercher
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "text-xs",
            isDark ? "text-white/50" : "text-muted-foreground"
          )}
        >
          Populaire :
        </span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQuery(s);
              submit(s);
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              isDark
                ? "border-white/10 bg-white/10 text-white/80 hover:bg-white/20"
                : "border-border bg-muted/60 text-foreground hover:border-brand-300 hover:bg-brand-50"
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </form>
  );
}
