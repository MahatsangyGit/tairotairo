"use client";

import Link from "next/link";
import NotificationBell from "@/components/notifications/NotificationBell";
import MessageInboxLink from "@/components/messages/MessageInboxLink";
import ThemeToggle from "@/components/theme/ThemeToggle";
import UserAvatar from "@/components/profile/UserAvatar";
import ClientProBadge from "@/components/profile/ClientProBadge";
import GuestBrowseTrigger from "@/components/auth/GuestBrowseTrigger";
import { isProfessionalClient } from "@/lib/client-kind";

export interface NavbarUser {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "PROVIDER" | "ADMIN";
  avatar: string | null;
  clientKind?: "INDIVIDUAL" | "PROFESSIONAL";
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

function UserChipContent({ user }: { user: NavbarUser }) {
  return (
    <>
      <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
      <span className="flex max-w-36 items-center gap-1.5">
        <span className="truncate text-sm font-medium text-foreground">
          {user.name}
        </span>
        {isProfessionalClient(user) ? <ClientProBadge /> : null}
      </span>
    </>
  );
}

function MobileUserCardContent({ user }: { user: NavbarUser }) {
  return (
    <>
      <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <span className="truncate">{user.name}</span>
          {isProfessionalClient(user) ? <ClientProBadge /> : null}
        </p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
    </>
  );
}

const ROLE_LINKS: Record<
  NavbarUser["role"],
  readonly { href: string; label: string; mobileOnly?: boolean }[]
> = {
  CLIENT: [
    { href: "/dashboard/client", label: "Réservations" },
    { href: "/dashboard/client/requests", label: "Mes demandes" },
  ],
  PROVIDER: [
    { href: "/dashboard/provider", label: "Tableau de bord" },
    { href: "/dashboard/provider/services", label: "Mes annonces" },
    { href: "/dashboard/provider/proposals", label: "Mes propositions", mobileOnly: true },
  ],
  ADMIN: [{ href: "/dashboard/admin", label: "Administration" }],
};

export function NavbarDesktopNav({
  user,
  showEcosystemAccess,
  messagesHref,
  profileHref,
  showGuestAuth,
  navLinkClass,
  onLogout,
}: {
  user: NavbarUser | null;
  showEcosystemAccess: boolean;
  messagesHref: string | null;
  profileHref: string | null;
  showGuestAuth: boolean;
  navLinkClass: (href: string) => string;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="hidden md:flex items-center gap-4">
        {user && (
          <>
            <Link href="/services" className={navLinkClass("/services")}>
              Services
            </Link>
            <Link href="/requests" className={navLinkClass("/requests")}>
              Demandes
            </Link>
            {showEcosystemAccess && (
              <div
                className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1"
                aria-label="Services de l'écosystème Tairo"
              >
                <Link
                  href="/ampindramo"
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-background hover:text-brand-700 dark:hover:text-brand-300"
                >
                  Ampindramo
                </Link>
                <Link
                  href="/ampianaro"
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-background hover:text-brand-700 dark:hover:text-brand-300"
                >
                  Ampianaro
                </Link>
              </div>
            )}
            {ROLE_LINKS[user.role]
              .filter((item) => !item.mobileOnly)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(item.href)}
                >
                  {item.label}
                </Link>
              ))}
            {messagesHref && <MessageInboxLink href={messagesHref} variant="nav" />}
          </>
        )}
      </div>

      <div className="hidden md:flex items-center gap-3">
        <ThemeToggle />
        {user ? (
          <>
            <NotificationBell />
            {messagesHref && <MessageInboxLink href={messagesHref} />}
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <UserChipContent user={user} />
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <UserChipContent user={user} />
                </div>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
              >
                Déconnexion
              </button>
            </div>
          </>
        ) : (
          showGuestAuth && (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-muted-foreground px-3 py-2 rounded-lg transition-colors hover:bg-primary/30 hover:text-primary dark:hover:bg-tertiary-400/30 dark:hover:text-white"
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
          )
        )}
      </div>
    </>
  );
}

export function NavbarMobileMenu({
  user,
  showEcosystemAccess,
  messagesHref,
  profileHref,
  adminHref,
  showGuestAuth,
  isActive,
  onClose,
  onLogout,
}: {
  user: NavbarUser | null;
  showEcosystemAccess: boolean;
  messagesHref: string | null;
  profileHref: string | null;
  adminHref: string | null;
  showGuestAuth: boolean;
  isActive: (href: string) => boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="md:hidden border-t border-border bg-card">
      <div className="px-4 py-4 flex flex-col gap-1">
        <div className="flex items-center justify-between px-3 py-2 mb-1">
          <span className="text-sm font-medium text-muted-foreground">Thème</span>
          <ThemeToggle />
        </div>
        {user ? (
          <>
            <MobileNavLink
              href="/services"
              label="Services"
              active={isActive("/services")}
              onClick={onClose}
            />
            <MobileNavLink
              href="/requests"
              label="Demandes"
              active={isActive("/requests")}
              onClick={onClose}
            />
          </>
        ) : (
          <>
            <GuestBrowseTrigger
              browse="services"
              onActivate={onClose}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors text-left w-full"
            >
              Voir tous les services
            </GuestBrowseTrigger>
            <GuestBrowseTrigger
              browse="requests"
              onActivate={onClose}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors text-left w-full"
            >
              Voir toutes les demandes
            </GuestBrowseTrigger>
          </>
        )}

        {user && (
          <>
            <div className="h-px bg-border my-2" />
            {showEcosystemAccess && (
              <>
                <p className="px-3 pt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Écosystème Tairo
                </p>
                <MobileNavLink
                  href="/ampindramo"
                  label="Ampindramo — Louer du matériel"
                  active={isActive("/ampindramo")}
                  onClick={onClose}
                />
                <MobileNavLink
                  href="/ampianaro"
                  label="Ampianaro — Se former"
                  active={isActive("/ampianaro")}
                  onClick={onClose}
                />
                <div className="h-px bg-border my-2" />
              </>
            )}
            {ROLE_LINKS[user.role].map((item) => (
              <MobileNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={isActive(item.href)}
                onClick={onClose}
              />
            ))}
            {messagesHref && (
              <MobileNavLink
                href={messagesHref}
                label="Messages"
                active={isActive(messagesHref)}
                onClick={onClose}
              />
            )}

            <div className="h-px bg-border my-2" />
            {profileHref ? (
              <Link
                href={profileHref}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(profileHref)
                    ? "bg-brand-50 dark:bg-brand-900/30"
                    : "hover:bg-muted/50"
                }`}
              >
                <MobileUserCardContent user={user} />
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2">
                <MobileUserCardContent user={user} />
              </div>
            )}
            {profileHref && user.role === "CLIENT" && (
              <MobileNavLink
                href={profileHref}
                label={isProfessionalClient(user) ? "Fiche société" : "Mon profil"}
                active={isActive(profileHref)}
                onClick={onClose}
              />
            )}
            {adminHref && (
              <MobileNavLink
                href={adminHref}
                label="Administration"
                active={isActive(adminHref)}
                onClick={onClose}
              />
            )}
            <button
              type="button"
              onClick={onLogout}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              Déconnexion
            </button>
          </>
        )}

        {showGuestAuth && (
          <>
            <div className="h-px bg-border my-2" />
            <MobileNavLink
              href="/auth/login"
              label="Connexion"
              active={isActive("/auth/login")}
              onClick={onClose}
            />
            <Link
              href="/auth/register"
              onClick={onClose}
              className="mt-1 block text-center bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              S&apos;inscrire
            </Link>
            <Link
              href="/auth/register?type=pro"
              onClick={onClose}
              className="mt-1 block text-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50"
            >
              Compte entreprise
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
