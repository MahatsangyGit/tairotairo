"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AmpindramoSearch({
  initialSearch,
  initialCategory,
  categories,
}: {
  initialSearch: string;
  initialCategory: string;
  categories: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    router.push(`/ampindramo?${params.toString()}`);
  }

  return (
    <form onSubmit={applyFilters} className="mb-8 flex flex-col gap-3 sm:flex-row">
      <input
        type="search"
        placeholder="Rechercher…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="">Toutes catégories</option>
        {categories.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <Button type="submit" variant="outline">
        Filtrer
      </Button>
      <Button asChild>
        <Link href="/ampindramo/publier">Publier mon matériel</Link>
      </Button>
    </form>
  );
}
