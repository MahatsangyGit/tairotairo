"use client";

import { useRouter } from "next/navigation";

export default function AmpianaroFilters({
  initialCategory,
  categories,
}: {
  initialCategory: string;
  categories: { value: string; label: string }[];
}) {
  const router = useRouter();

  return (
    <div className="mb-8">
      <select
        value={initialCategory}
        onChange={(e) => {
          const value = e.target.value;
          router.push(
            value ? `/ampianaro?category=${encodeURIComponent(value)}` : "/ampianaro"
          );
        }}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="">Toutes thématiques</option>
        {categories.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
