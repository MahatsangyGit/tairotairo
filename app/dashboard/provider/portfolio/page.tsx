"use client";

import Link from "next/link";
import ProviderPortfolioPanel from "@/components/portfolio/ProviderPortfolioPanel";
import { useDashboardMe } from "@/hooks/useDashboardMe";

export default function ProviderPortfolioPage() {
  const { user, loading, error } = useDashboardMe({
    loginCallbackUrl: "/dashboard/provider/portfolio",
    redirectIfRole: "CLIENT",
    redirectHref: "/dashboard/client/profile",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground mb-1">Mon portfolio</h1>
        <p className="text-muted-foreground text-sm">
          Vos réalisations visibles sur votre profil public — commentaires
          possibles par les clients
        </p>
      </div>
      {user && (
        <Link
          href={`/providers/${user.id}`}
          className="inline-block text-sm text-brand-600 font-medium hover:underline mb-4"
        >
          Voir mon profil public →
        </Link>
      )}
      {loading && <p className="text-muted-foreground">Chargement...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && <ProviderPortfolioPanel />}
    </div>
  );
}
