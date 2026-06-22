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

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "PROVIDER" | "ADMIN";
  avatar: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  authChecked: boolean;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const refreshUser = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch("/api/auth/me", { signal: controller.signal });
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      clearTimeout(timeout);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    refreshUser();
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
