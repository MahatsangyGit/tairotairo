"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import NotificationBell from "@/components/notifications/NotificationBell";
import MessageInboxLink from "@/components/messages/MessageInboxLink";
import ThemeToggle from "@/components/theme/ThemeToggle";
import UserAvatar from "@/components/profile/UserAvatar";
import { SITE_NAME } from "@/lib/site";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "PROVIDER" | "ADMIN";
  avatar: string | null;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        setUser(data.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    fetchUser();

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
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setIsMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const close = () => setIsMenuOpen(false);

  const profileHref =
    user?.role === "CLIENT"
      ? "/dashboard/client/profile"
      : user?.role === "PROVIDER"
        ? "/dashboard/provider/profile"
        : null;

  const adminHref = user?.role === "ADMIN" ? "/dashboard/admin" : null;

  const messagesHref =
    user?.role === "CLIENT"
      ? "/dashboard/client/messages"
      : user?.role === "PROVIDER"
        ? "/dashboard/provider/messages"
        : null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const navLinkClass = (href: string) =>
    `text-sm font-medium transition-colors ${
      isActive(href)
        ? "text-brand-600 dark:text-brand-400"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            onClick={close}
          >
            <span className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="2" />
                <path d="M4 7h6M7 4v6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-lg font-bold text-foreground tracking-tight">
              {SITE_NAME}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/services" className={navLinkClass("/services")}>
              Services
            </Link>
            <Link href="/requests" className={navLinkClass("/requests")}>
              Demandes
            </Link>

            {!authLoading && user && (
              <>
                {user.role === "CLIENT" && (
                  <>
                    <Link href="/dashboard/client" className={navLinkClass("/dashboard/client")}>
                      Réservations
                    </Link>
                    <Link href="/dashboard/client/requests" className={navLinkClass("/dashboard/client/requests")}>
                      Mes demandes
                    </Link>
                    {messagesHref && (
                      <MessageInboxLink href={messagesHref} variant="nav" />
                    )}
                  </>
                )}
                {user.role === "PROVIDER" && (
                  <>
                    <Link href="/dashboard/provider" className={navLinkClass("/dashboard/provider")}>
                      Tableau de bord
                    </Link>
                    <Link href="/dashboard/provider/services" className={navLinkClass("/dashboard/provider/services")}>
                      Mes annonces
                    </Link>
                    {messagesHref && (
                      <MessageInboxLink href={messagesHref} variant="nav" />
                    )}
                  </>
                )}
                {user.role === "ADMIN" && (
                  <Link href="/dashboard/admin" className={navLinkClass("/dashboard/admin")}>
                    Administration
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {!authLoading && user && (
              <>
                <NotificationBell />
                {messagesHref && <MessageInboxLink href={messagesHref} />}
                <div className="flex items-center gap-2 pl-3 border-l border-border">
                  {profileHref ? (
                    <Link href={profileHref} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                      <span className="text-sm font-medium text-foreground max-w-28 truncate">
                        {user.name}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                      <span className="text-sm font-medium text-foreground max-w-28 truncate">
                        {user.name}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                  >
                    Déconnexion
                  </button>
                </div>
              </>
            )}

            {!authLoading && !user && (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMenuOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div ref={menuRef} className="md:hidden border-t border-border bg-card">
          <div className="px-4 py-4 flex flex-col gap-1">
            <div className="flex items-center justify-between px-3 py-2 mb-1">
              <span className="text-sm font-medium text-muted-foreground">Thème</span>
              <ThemeToggle />
            </div>
            <MobileNavLink href="/services" label="Services" active={isActive("/services")} onClick={close} />
            <MobileNavLink href="/requests" label="Demandes" active={isActive("/requests")} onClick={close} />

            {!authLoading && user && (
              <>
                <div className="h-px bg-border my-2" />
                {user.role === "CLIENT" && (
                  <>
                    <MobileNavLink href="/dashboard/client" label="Réservations" active={isActive("/dashboard/client")} onClick={close} />
                    <MobileNavLink href="/dashboard/client/requests" label="Mes demandes" active={isActive("/dashboard/client/requests")} onClick={close} />
                    {messagesHref && (
                      <MobileNavLink href={messagesHref} label="Messages" active={isActive(messagesHref)} onClick={close} />
                    )}
                  </>
                )}
                {user.role === "PROVIDER" && (
                  <>
                    <MobileNavLink href="/dashboard/provider" label="Tableau de bord" active={isActive("/dashboard/provider")} onClick={close} />
                    <MobileNavLink href="/dashboard/provider/services" label="Mes annonces" active={isActive("/dashboard/provider/services")} onClick={close} />
                    <MobileNavLink href="/dashboard/provider/proposals" label="Mes propositions" active={isActive("/dashboard/provider/proposals")} onClick={close} />
                    {messagesHref && (
                      <MobileNavLink href={messagesHref} label="Messages" active={isActive(messagesHref)} onClick={close} />
                    )}
                  </>
                )}
                {user.role === "ADMIN" && (
                  <MobileNavLink href="/dashboard/admin" label="Administration" active={isActive("/dashboard/admin")} onClick={close} />
                )}

                <div className="h-px bg-border my-2" />
                {profileHref ? (
                  <Link
                    href={profileHref}
                    onClick={close}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive(profileHref) ? "bg-brand-50 dark:bg-brand-900/30" : "hover:bg-muted/50"
                    }`}
                  >
                    <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2">
                    <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                )}
                {profileHref && user.role === "CLIENT" && (
                  <MobileNavLink href={profileHref} label="Mon profil" active={isActive(profileHref)} onClick={close} />
                )}
                {adminHref && (
                  <MobileNavLink href={adminHref} label="Administration" active={isActive(adminHref)} onClick={close} />
                )}
                <button
                  onClick={handleLogout}
                  className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  Déconnexion
                </button>
              </>
            )}

            {!authLoading && !user && (
              <>
                <div className="h-px bg-border my-2" />
                <MobileNavLink href="/auth/login" label="Connexion" active={isActive("/auth/login")} onClick={close} />
                <Link
                  href="/auth/register"
                  onClick={close}
                  className="mt-1 block text-center bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
                >
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function MobileNavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
          : "text-foreground hover:bg-muted/50"
      }`}
    >
      {label}
    </Link>
  );
}
