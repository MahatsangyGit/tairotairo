"use client";

import Link from "next/link";
import ProfileForm from "@/components/profile/ProfileForm";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";
import ProviderKycPanel from "@/components/kyc/ProviderKycPanel";
import { useDashboardMe } from "@/hooks/useDashboardMe";

export default function ProviderProfilePage() {
  const { user, loading, error } = useDashboardMe({
    loginCallbackUrl: "/dashboard/provider/profile",
    redirectIfRole: "CLIENT",
    redirectHref: "/dashboard/client/profile",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground mb-1">Mon profil</h1>
        <p className="text-muted-foreground text-sm">
          Photo, coordonnées, présentation, NIF / STAT / RCS (optionnel),
          vérification email et identité (KYC)
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
      {user && (
        <>
          <ProviderKycPanel />
          <ProfileForm initialUser={user} showBio />
          <NotificationPreferences />
        </>
      )}
    </div>
  );
}
