"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProviderPortfolioPanel from "@/components/portfolio/ProviderPortfolioPanel";

export default function ProviderPortfolioPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/auth/login?callbackUrl=/dashboard/provider/portfolio");
            return;
          }
          setError(data.error ?? "Erreur");
          return;
        }

        if (data.user.role === "CLIENT") {
          router.push("/dashboard/client/profile");
          return;
        }

        setUserId(data.user.id);
      } catch {
        setError("Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [router]);

  return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground mb-1">Mon portfolio</h1>
          <p className="text-muted-foreground text-sm">
            Vos réalisations visibles sur votre profil public — commentaires
            possibles par les clients
          </p>
        </div>
        {userId && (
          <Link
            href={`/providers/${userId}`}
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
