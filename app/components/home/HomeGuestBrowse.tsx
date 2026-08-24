"use client";

import Link from "next/link";
import GuestBrowseTrigger from "@/components/auth/GuestBrowseTrigger";
import { useAuth } from "@/components/auth/AuthProvider";
import CategoryIcon from "@/components/categories/CategoryIcon";
import { CATEGORY_META } from "@/lib/categories";

export function HomeCategoriesBrowse() {
  return (
    <>
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-brand-600 text-xs font-semibold uppercase tracking-widest mb-2">
            Parcourir
          </p>
          <h2 className="text-3xl font-bold text-foreground">Nos catégories</h2>
        </div>
        <GuestBrowseTrigger
          browse="services"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
        >
          Tout voir →
        </GuestBrowseTrigger>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {CATEGORY_META.map((cat) => (
          <GuestBrowseTrigger
            key={cat.slug}
            browse="services"
            href={`/services/categorie/${cat.slug}`}
            className="group flex flex-col items-center gap-3 p-5 bg-card border border-border rounded-2xl hover:border-tertiary-400 hover:bg-tertiary-50 dark:hover:bg-tertiary-50 transition-all text-left"
          >
            <span
              className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 dark:text-brand-400 group-hover:bg-brand-100 transition-colors"
              aria-hidden
            >
              <CategoryIcon slug={cat.slug} size={26} />
            </span>
            <span className="text-sm font-medium text-foreground group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors text-center">
              {cat.name}
            </span>
          </GuestBrowseTrigger>
        ))}
      </div>
    </>
  );
}

export function HomeProviderBrowseCta() {
  return (
    <GuestBrowseTrigger
      browse="requests"
      className="inline-flex items-center text-brand-700 px-5 py-3 rounded-xl text-sm font-medium border border-tertiary-300 hover:bg-tertiary-100 transition-colors w-fit"
    >
      Voir toutes les demandes
    </GuestBrowseTrigger>
  );
}

export function HomeFooterLinks() {
  const { user } = useAuth();
  const dashboardHref =
    user?.role === "CLIENT"
      ? "/dashboard/client"
      : user?.role === "PROVIDER"
        ? "/dashboard/provider"
        : user?.role === "ADMIN"
          ? "/dashboard/admin"
          : null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
      <GuestBrowseTrigger
        browse="services"
        className="hover:text-foreground transition-colors"
      >
        Voir tous les services
      </GuestBrowseTrigger>
      <GuestBrowseTrigger
        browse="requests"
        className="hover:text-foreground transition-colors"
      >
        Voir toutes les demandes
      </GuestBrowseTrigger>
      {dashboardHref ? (
        <Link
          href={dashboardHref}
          className="hover:text-foreground transition-colors"
        >
          Mon espace
        </Link>
      ) : (
        <Link
          href="/auth/register"
          className="hover:text-foreground transition-colors"
        >
          S&apos;inscrire
        </Link>
      )}
      <Link href="/cgu" className="hover:text-foreground transition-colors">
        CGU
      </Link>
    </div>
  );
}
