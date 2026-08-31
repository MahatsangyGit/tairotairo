"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProfileUser } from "@/components/profile/ProfileForm";

export function useDashboardMe({
  loginCallbackUrl,
  redirectIfRole,
  redirectHref,
}: {
  loginCallbackUrl: string;
  redirectIfRole?: string;
  redirectHref?: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          if (res.status === 401) {
            router.push(`/auth/login?callbackUrl=${loginCallbackUrl}`);
            return;
          }
          setError(data.error ?? "Erreur");
          return;
        }

        if (redirectIfRole && redirectHref && data.user?.role === redirectIfRole) {
          router.push(redirectHref);
          return;
        }

        setUser(data.user);
      } catch {
        if (!cancelled) setError("Une erreur est survenue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [router, loginCallbackUrl, redirectIfRole, redirectHref]);

  return { user, loading, error };
}
