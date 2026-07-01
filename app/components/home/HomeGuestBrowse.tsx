"use client";

import Link from "next/link";
import GuestBrowseTrigger from "@/components/auth/GuestBrowseTrigger";
import { CATEGORY_META } from "@/lib/categories";

export function HomeHeroBrowseCtas() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <GuestBrowseTrigger
        browse="services"
        className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-brand-500 transition-colors text-sm"
      >
        Voir tous les services
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </GuestBrowseTrigger>
      <GuestBrowseTrigger
        browse="requests"
        className="inline-flex items-center justify-center bg-white/10 text-white border border-white/20 px-7 py-3.5 rounded-xl font-semibold hover:bg-white/15 transition-colors text-sm"
      >
        Voir toutes les demandes
      </GuestBrowseTrigger>
    </div>
  );
}

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
            <span className="text-2xl" role="img" aria-label={cat.name}>
              {cat.icon}
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
      <Link href="/auth/register" className="hover:text-foreground transition-colors">
        S&apos;inscrire
      </Link>
    </div>
  );
}
