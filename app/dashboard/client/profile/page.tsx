"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ClientNav from "@/components/layout/ClientNav";
import ProfileForm, { type ProfileUser } from "@/components/profile/ProfileForm";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";

export default function ClientProfilePage() {
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
            router.push("/auth/login?callbackUrl=/dashboard/client/profile");
            return;
          }
          setError(data.error ?? "Erreur");
          return;
        }

        if (data.user.role === "PROVIDER") {
          router.push("/dashboard/provider/profile");
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
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Espace client</h1>
          <p className="text-gray-500 text-sm">
            Mon profil, photo et vérification email
          </p>
        </div>
        <ClientNav />
        {loading && <p className="text-gray-500">Chargement...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {user && (
          <>
            <ProfileForm initialUser={user} />
            <NotificationPreferences />
          </>
        )}
      </div>
    </div>
  );
}
