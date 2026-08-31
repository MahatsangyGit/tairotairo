import type { Metadata } from "next";
import JsonLdScripts from "@/components/seo/JsonLdScripts";
import FeaturedProvidersSection from "@/components/home/FeaturedProvidersSection";
import FeaturedServicesSection from "@/components/home/FeaturedServicesSection";
import HomeBecomeProvider from "@/components/home/HomeBecomeProvider";
import HomeHero from "@/components/home/HomeHero";
import HomeGuestOnly from "@/components/home/HomeGuestOnly";
import HomeReviewsFeed from "@/components/home/HomeReviewsFeed";
import HomeTrustStats from "@/components/home/HomeTrustStats";
import {
  HomeCategoriesBrowse,
  HomeFooterLinks,
} from "@/components/home/HomeGuestBrowse";
import { PARENT_COMPANY, SITE_NAME } from "@/lib/site";
import {
  getFeaturedProvidersForHome,
  getFeaturedServicesForHome,
  getHomeSocialProof,
} from "@/lib/featured-home";
import { homeMetadata } from "@/lib/seo";
import { SEO_SCHEMA_PATHS } from "@/lib/seo-schema-routes";
// Doit être un littéral statique (voir PAGE_REVALIDATE_SECONDS.HOME).
export const revalidate = 120;

export const metadata: Metadata = homeMetadata();

async function loadOrEmpty<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const [featuredServices, featuredProviders, socialProof] = await Promise.all([
    loadOrEmpty(getFeaturedServicesForHome, []),
    loadOrEmpty(getFeaturedProvidersForHome, []),
    loadOrEmpty(getHomeSocialProof, {
      providerCount: 0,
      completedCount: 0,
      reviews: [],
    }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScripts paths={SEO_SCHEMA_PATHS.home} />

      <HomeHero />

      <FeaturedProvidersSection providers={featuredProviders} />

      <HomeTrustStats
        providerCount={socialProof.providerCount}
        completedCount={socialProof.completedCount}
      />

      <FeaturedServicesSection services={featuredServices} />

      <HomeReviewsFeed reviews={socialProof.reviews} />

      <section
        id="categories"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <HomeCategoriesBrowse />
      </section>

      <HomeGuestOnly>
        <HomeBecomeProvider />
      </HomeGuestOnly>

      <section className="border-t border-border bg-tertiary-50/40 dark:bg-muted/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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

      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
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
