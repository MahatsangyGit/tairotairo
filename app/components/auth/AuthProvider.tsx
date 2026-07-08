"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/lib/auth-user";

export type { AuthUser };

interface AuthContextValue {
  user: AuthUser | null;
  authChecked: boolean;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  /** Snapshot SSR — doit être identique au premier rendu client. */
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  // true dès le départ : le snapshot SSR est déjà la source de vérité pour l'hydratation
  const [authChecked, setAuthChecked] = useState(true);

  const refreshUser = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch("/api/auth/me", {
        signal: controller.signal,
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();

      if (res.ok) {
        setUser(data.user ?? null);
      } else if (res.status === 401 || res.status === 403) {
        setUser(null);
      }
    } catch {
      /* erreur réseau : conserver l'état courant */
    } finally {
      clearTimeout(timeout);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const onAuthChanged = () => {
      void refreshUser();
    };

    window.addEventListener("auth-changed", onAuthChanged);
    return () => {
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, [refreshUser]);

  useEffect(() => {
    const onAvatarUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ avatar: string | null }>).detail;
      setUser((current) =>
        current ? { ...current, avatar: detail.avatar } : current
      );
    };

    window.addEventListener("profile-avatar-updated", onAvatarUpdated);
    return () => {
      window.removeEventListener("profile-avatar-updated", onAvatarUpdated);
    };
  }, []);

  const value = useMemo(
    () => ({ user, authChecked, setUser, refreshUser }),
    [user, authChecked, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return context;
}
