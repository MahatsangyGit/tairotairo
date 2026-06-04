"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import NotificationBell from "@/components/notifications/NotificationBell";
import { SITE_NAME } from "@/lib/site";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "PROVIDER" | "ADMIN";
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setIsMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const profileHref =
    user?.role === "CLIENT"
      ? "/dashboard/client/profile"
      : user?.role === "PROVIDER"
        ? "/dashboard/provider/profile"
        : null;

  const messagesHref =
    user?.role === "CLIENT"
      ? "/dashboard/client/messages"
      : user?.role === "PROVIDER"
        ? "/dashboard/provider/messages"
        : null;

  const shortcutClass = (active: boolean, mobile: boolean) =>
    `text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
      active
        ? "bg-brand-600 text-white border-brand-600"
        : "border-brand-200 text-brand-600 hover:bg-brand-50"
    } ${mobile ? "inline-block" : ""}`;

  const UserAccountBlock = ({ mobile = false }: { mobile?: boolean }) => {
    if (!user) return null;

    const close = () => mobile && setIsMenuOpen(false);
    const profileActive =
      profileHref != null &&
      (pathname === profileHref || pathname.startsWith(`${profileHref}/`));
    const messagesActive =
      messagesHref != null &&
      (pathname === messagesHref || pathname.startsWith(`${messagesHref}/`));

    if (!profileHref && !messagesHref) {
      return (
        <span className="text-sm font-semibold text-gray-800">{user.name}</span>
      );
    }

    return (
      <div
        className={
          mobile
            ? "flex flex-col items-start gap-2 w-full"
            : "flex items-center gap-2 border-l border-gray-200 pl-4"
        }
      >
        <span className="text-sm font-semibold text-gray-800">{user.name}</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {profileHref && (
            <Link
              href={profileHref}
              onClick={close}
              className={shortcutClass(profileActive, mobile)}
            >
              Mon profil
            </Link>
          )}
          {messagesHref && (
            <Link
              href={messagesHref}
              onClick={close}
              className={shortcutClass(messagesActive, mobile)}
            >
              Messages
            </Link>
          )}
        </div>
      </div>
    );
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <Link
        href="/services"
        onClick={() => mobile && setIsMenuOpen(false)}
        className="text-gray-600 hover:text-brand-600 font-medium transition-colors"
      >
        Services
      </Link>
      <Link
        href="/requests"
        onClick={() => mobile && setIsMenuOpen(false)}
        className="text-gray-600 hover:text-amber-600 font-medium transition-colors"
      >
        Demandes
      </Link>

      {!authLoading && user && (
        <>
          <NotificationBell />
          {user.role === "CLIENT" && (
            <>
              <Link
                href="/dashboard/client"
                onClick={() => mobile && setIsMenuOpen(false)}
                className="text-gray-600 hover:text-brand-600 font-medium transition-colors"
              >
                Réservations
              </Link>
              <Link
                href="/dashboard/client/requests"
                onClick={() => mobile && setIsMenuOpen(false)}
                className="text-gray-600 hover:text-amber-600 font-medium transition-colors"
              >
                Mes demandes
              </Link>
            </>
          )}
          {user.role === "PROVIDER" && (
            <>
              <Link
                href="/dashboard/provider"
                onClick={() => mobile && setIsMenuOpen(false)}
                className="text-gray-600 hover:text-brand-600 font-medium transition-colors"
              >
                Réservations
              </Link>
              <Link
                href="/dashboard/provider/proposals"
                onClick={() => mobile && setIsMenuOpen(false)}
                className="text-gray-600 hover:text-brand-600 font-medium transition-colors"
              >
                Mes propositions
              </Link>
              <Link
                href="/dashboard/provider/services"
                onClick={() => mobile && setIsMenuOpen(false)}
                className="text-gray-600 hover:text-brand-600 font-medium transition-colors"
              >
                Mes annonces
              </Link>
            </>
          )}
          <UserAccountBlock mobile={mobile} />
          <button
            onClick={handleLogout}
            className={`text-gray-600 hover:text-brand-600 font-medium transition-colors ${
              mobile ? "text-left" : ""
            }`}
          >
            Déconnexion
          </button>
        </>
      )}

      {!authLoading && !user && (
        <>
          <Link
            href="/auth/login"
            onClick={() => mobile && setIsMenuOpen(false)}
            className="text-gray-600 hover:text-brand-600 font-medium transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/dashboard/provider"
            onClick={() => mobile && setIsMenuOpen(false)}
            className="text-gray-600 hover:text-brand-600 font-medium transition-colors"
          >
            Espace pro
          </Link>
          <Link
            href="/auth/register"
            onClick={() => mobile && setIsMenuOpen(false)}
            className={`bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors ${
              mobile ? "text-center" : ""
            }`}
          >
            S&apos;inscrire
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-brand-600">{SITE_NAME}</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <NavLinks />
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Menu"
          >
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current" />
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 flex flex-col gap-3">
            <NavLinks mobile />
          </div>
        )}
      </div>
    </nav>
  );
}
