"use client";

import Link from "next/link";
import {
  formatCommissionPercent,
  RENTAL_PARTICULAR_COMMISSION_RATE,
  RENTAL_PRO_TIERS,
  SERVICE_COMMISSION_ROWS,
} from "@/lib/economy";
import { SUBSCRIPTION_MONTHLY_PRICE_MGA } from "@/lib/subscription-plans";

function RateTable({
  rows,
}: {
  rows: { label: string; rate: number }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <th className="px-3 py-2 font-medium">Barème</th>
            <th className="px-3 py-2 font-medium">Taux</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="px-3 py-2">{row.label}</td>
              <td className="px-3 py-2 font-medium">
                {formatCommissionPercent(row.rate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminEconomyPanel() {
  return (
    <section className="mt-10 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Modèle économique</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Taux en vigueur, aussi publiés dans les{" "}
          <Link href="/cgu" className="text-brand-600 hover:underline">
            CGU
          </Link>
          .
        </p>
      </div>

      <div className="rounded-2xl border border-border p-5">
        <h3 className="font-medium mb-2">Abonnement prestataire (optionnel)</h3>
        <p className="text-2xl font-bold text-foreground">
          {SUBSCRIPTION_MONTHLY_PRICE_MGA.toLocaleString("fr-MG")} Ar
          <span className="text-sm font-normal text-muted-foreground"> / mois</span>
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Mise en avant uniquement. Non requis pour travailler sur Tairo ampio.
        </p>
      </div>

      <div>
        <h3 className="font-medium mb-2">Commissions services (sur le prestataire)</h3>
        <RateTable
          rows={SERVICE_COMMISSION_ROWS.map((row) => ({
            label: row.category,
            rate: row.rate,
          }))}
        />
      </div>

      <div>
        <h3 className="font-medium mb-2">Commissions location ampindramo</h3>
        <RateTable
          rows={[
            {
              label: "Particulier (loyer, hors caution)",
              rate: RENTAL_PARTICULAR_COMMISSION_RATE,
            },
            ...RENTAL_PRO_TIERS.map((tier) => ({
              label: `Client professionnel — ${tier.label}`,
              rate: tier.rate,
            })),
            { label: "Catalogue Tairo (Mobile Money plateforme)", rate: 0 },
          ]}
        />
      </div>
    </section>
  );
}
