"use client";

import ProfileForm from "@/components/profile/ProfileForm";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";
import { useDashboardMe } from "@/hooks/useDashboardMe";

export default function ClientProfilePage() {
  const { user, loading, error } = useDashboardMe({
    loginCallbackUrl: "/dashboard/client/profile",
    redirectIfRole: "PROVIDER",
    redirectHref: "/dashboard/provider/profile",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {user?.clientKind === "PROFESSIONAL"
            ? "Espace entreprise"
            : "Espace client"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {user?.clientKind === "PROFESSIONAL"
            ? "Fiche société, identifiants légaux et vérification email"
            : "Mon profil, photo et vérification email"}
        </p>
      </div>
      {loading && <p className="text-muted-foreground">Chargement...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {user && (
        <>
          <ProfileForm initialUser={user} />
          <NotificationPreferences />
        </>
      )}
    </div>
  );
}
