"use client";

import { useState } from "react";
import AdminStatsPanel from "@/components/admin/AdminStatsPanel";
import AdminSpotlightPanel from "@/components/admin/AdminSpotlightPanel";

const TABS = [
  { id: "stats", label: "Statistiques" },
  { id: "subscriptions", label: "Abonnements" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminDashboard() {
  const [tab, setTab] = useState<TabId>("stats");

  return (
    <div>
      <nav className="flex gap-1 mb-8 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "stats" && <AdminStatsPanel />}
      {tab === "subscriptions" && <AdminSpotlightPanel />}
    </div>
  );
}
