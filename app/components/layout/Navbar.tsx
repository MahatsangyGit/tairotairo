"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { notifyAuthChanged } from "@/lib/auth-client";
import { isNavLinkActive } from "@/lib/nav-active";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  NavbarDesktopNav,
  NavbarMobileMenu,
} from "@/components/layout/NavbarMenus";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === "/";
  const blendWithHero = isHome && isAtTop;
  const showGuestAuth = !user;

  useEffect(() => {
    if (!isHome) return;

    const handleScroll = () => {
      setIsAtTop(window.scrollY <= 0);
    };

    const frame = window.requestAnimationFrame(handleScroll);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isHome]);

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
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    notifyAuthChanged();
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
  const showEcosystemAccess =
    user?.role === "CLIENT" || user?.role === "PROVIDER";

  const messagesHref =
    user?.role === "CLIENT"
      ? "/dashboard/client/messages"
      : user?.role === "PROVIDER"
        ? "/dashboard/provider/messages"
        : null;

  const isActive = (href: string) => isNavLinkActive(pathname, href);

  const navLinkClass = (href: string) =>
    `text-sm font-medium transition-colors ${
      isActive(href)
        ? "text-brand-600 dark:text-brand-400"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <nav
      ref={menuRef}
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color] duration-200",
        blendWithHero
          ? "bg-background"
          : "bg-card/95 backdrop-blur-sm border-b border-border"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 box-content">
        <div className="flex items-center justify-between h-16 box-content">
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

          <NavbarDesktopNav
            user={user}
            showEcosystemAccess={showEcosystemAccess}
            messagesHref={messagesHref}
            profileHref={profileHref}
            showGuestAuth={showGuestAuth}
            navLinkClass={navLinkClass}
            onLogout={handleLogout}
          />

          <button
            type="button"
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

      {isMenuOpen && (
        <NavbarMobileMenu
          user={user}
          showEcosystemAccess={showEcosystemAccess}
          messagesHref={messagesHref}
          profileHref={profileHref}
          adminHref={adminHref}
          showGuestAuth={showGuestAuth}
          isActive={isActive}
          onClose={close}
          onLogout={handleLogout}
        />
      )}
    </nav>
  );
}
