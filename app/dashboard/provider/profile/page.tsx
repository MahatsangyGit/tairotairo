"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ProviderNav from "@/components/layout/ProviderNav";
import ProfileForm, { type ProfileUser } from "@/components/profile/ProfileForm";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";
import ProviderKycPanel from "@/components/kyc/ProviderKycPanel";
import ProviderPortfolioPanel from "@/components/portfolio/ProviderPortfolioPanel";

export default function ProviderProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/auth/login?callbackUrl=/dashboard/provider/profile");
            return;
          }
          setError(data.error ?? "Erreur");
          return;
        }

        if (data.user.role === "CLIENT") {
          router.push("/dashboard/client/profile");
          return;
        }

        setUser(data.user);
      } catch {
        setError("Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Espace prestataire</h1>
          <p className="text-gray-500 text-sm">
            Mon profil public, portfolio, vérification email et identité (KYC)
          </p>
        </div>
        <ProviderNav />
        {user && (
          <Link
            href={`/providers/${user.id}`}
            className="inline-block text-sm text-brand-600 font-medium hover:underline mb-4"
          >
            Voir mon profil public →
          </Link>
        )}
        {loading && <p className="text-gray-500">Chargement...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {user && (
          <>
            <ProviderKycPanel />
            <ProviderPortfolioPanel />
            <ProfileForm initialUser={user} showBio />
            <NotificationPreferences />
          </>
        )}
      </div>
    </div>
  );
}
