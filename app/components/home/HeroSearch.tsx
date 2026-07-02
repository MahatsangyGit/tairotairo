"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SUGGESTIONS = ["Plomberie", "Électricité", "Ménage", "Cours Particuliers", "Transport"];

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

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
      <div className="flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1.5 pl-4 shadow-2xl shadow-black/20 focus-within:border-brand-300/60 transition-colors">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden="true"
          className="text-white/60 shrink-0"
        >
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un service… (ex : plombier, électricien)"
          aria-label="Rechercher un service"
          className="flex-1 bg-transparent text-white placeholder:text-white/50 text-sm sm:text-base outline-none min-w-0 py-2"
        />
        <button
          type="submit"
          className="shrink-0 inline-flex items-center justify-center bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold px-4 sm:px-5 h-10 rounded-xl transition-colors active:scale-[0.98]"
        >
          Rechercher
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="text-xs text-white/50">Populaire :</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQuery(s);
              submit(s);
            }}
            className="text-xs text-white/80 bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 rounded-full transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </form>
  );
}
