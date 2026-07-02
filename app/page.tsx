import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import JsonLdScripts from "@/components/seo/JsonLdScripts";
import FeaturedProvidersSection from "@/components/home/FeaturedProvidersSection";
import FeaturedServicesSection from "@/components/home/FeaturedServicesSection";
import {
  HomeCategoriesBrowse,
  HomeFooterLinks,
  HomeProviderBrowseCta,
} from "@/components/home/HomeGuestBrowse";
import { PARENT_COMPANY, SITE_NAME } from "@/lib/site";
import {
  getFeaturedProvidersForHome,
  getFeaturedServicesForHome,
} from "@/lib/featured-home";
import { homeMetadata } from "@/lib/seo";
import { SEO_SCHEMA_PATHS } from "@/lib/seo-schema-routes";
// Doit être un littéral statique (voir PAGE_REVALIDATE_SECONDS.HOME).
export const revalidate = 120;

export const metadata: Metadata = homeMetadata();

export default async function HomePage() {
  const [featuredServices, featuredProviders] = await Promise.all([
    getFeaturedServicesForHome(),
    getFeaturedProvidersForHome(),
  ]);

  const hasFeatured =
    featuredServices.length > 0 || featuredProviders.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScripts paths={SEO_SCHEMA_PATHS.home} />
      <Navbar />

      {/* Hero */}
      <section className="bg-background text-foreground border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-2xl">
            <p className="text-brand-600 dark:text-brand-400 text-sm font-semibold uppercase tracking-widest mb-4">
              Marketplace de services — Madagascar
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 text-foreground">
              Trouvez un prestataire{" "}
              <span className="text-brand-600 dark:text-brand-400">de confiance</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Rapide, simple et sécurisé. Connectez-vous avec des prestataires
              qualifiés près de chez vous.
            </p>
          </div>
        </div>
      </section>

      {/* Featured */}
      {hasFeatured && (
        <section className="py-4">
          <FeaturedServicesSection services={featuredServices} />
          <FeaturedProvidersSection providers={featuredProviders} />
        </section>
      )}

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <HomeCategoriesBrowse />
      </section>

      {/* Split CTA */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-950 text-white rounded-2xl p-8 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-7 14a7 7 0 0 1 14 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">
                  Vous cherchez un prestataire ?
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Publiez une annonce de demande et recevez des propositions de
                  prestataires qualifiés.
                </p>
              </div>
              <Link
                href="/dashboard/client/requests"
                className="mt-auto inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-brand-500 transition-colors w-fit"
              >
                Publier une demande
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            <div className="bg-tertiary-50 border border-tertiary-200 rounded-2xl p-8 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="2" y="8" width="16" height="10" rx="2" stroke="white" strokeWidth="1.5" />
                  <path d="M7 8V6a3 3 0 0 1 6 0v2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Vous êtes prestataire ?
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Rejoignez {SITE_NAME} et trouvez des clients près de chez vous.
                  Mettez votre profil en avant et développez votre activité.
                </p>
              </div>
              <div className="mt-auto flex flex-col sm:flex-row gap-3">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors w-fit"
                >
                  Devenir prestataire
                </Link>
                <HomeProviderBrowseCta />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-tertiary-50/40 dark:bg-muted/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <p className="text-brand-600 text-xs font-semibold uppercase tracking-widest mb-2">
              Simple &amp; rapide
            </p>
            <h2 className="text-3xl font-bold text-foreground">
              Comment ça marche ?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Recherchez", desc: "Parcourez les services ou publiez votre demande." },
              { step: "02", title: "Choisissez", desc: "Comparez les profils, les avis et les tarifs." },
              { step: "03", title: "Réservez", desc: "Confirmez et échangez directement via la messagerie." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-3">
                <span className="text-4xl font-bold text-tertiary-400 dark:text-tertiary-600">{item.step}</span>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="2" />
                <path d="M4 7h6M7 4v6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <span className="font-semibold text-foreground">{SITE_NAME}</span>
          </div>
          <HomeFooterLinks />
          <p className="text-xs text-muted-foreground">
            Édité par <span className="text-muted-foreground">{PARENT_COMPANY}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
