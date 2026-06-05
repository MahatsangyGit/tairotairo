import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export const dynamic = "force-dynamic";
import FeaturedProvidersSection from "@/components/home/FeaturedProvidersSection";
import FeaturedServicesSection from "@/components/home/FeaturedServicesSection";
import {
  getFeaturedProvidersForHome,
  getFeaturedServicesForHome,
} from "@/lib/featured-home";
import { PARENT_COMPANY, SITE_NAME } from "@/lib/site";

const CATEGORIES = [
  { name: "Plomberie", icon: "🔧" },
  { name: "Mécanique", icon: "🛠️" },
  { name: "Électricité", icon: "⚡" },
  { name: "Jardinage", icon: "🌿" },
  { name: "Ménage", icon: "🧹" },
  { name: "Cours", icon: "📚" },
  { name: "Informatique", icon: "💻" },
  { name: "Cuisine", icon: "🍳" },
  { name: "Transport", icon: "🚗" },
  { name: "Iraka", icon: "🏠" },
  { name: "Evénementiel", icon: "🎉" },
];

export default async function HomePage() {
  const [featuredServices, featuredProviders] = await Promise.all([
    getFeaturedServicesForHome(),
    getFeaturedProvidersForHome(),
  ]);

  const hasFeatured =
    featuredServices.length > 0 || featuredProviders.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 50%, #069494 0%, transparent 60%), radial-gradient(circle at 80% 20%, #057676 0%, transparent 50%)",
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-2xl">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-4">
              Marketplace de services — Madagascar
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
              Trouvez un prestataire{" "}
              <span className="text-brand-400">de confiance</span>
            </h1>
            <p className="text-neutral-400 text-lg mb-10 leading-relaxed">
              Rapide, simple et sécurisé. Connectez-vous avec des prestataires
              qualifiés près de chez vous.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-brand-500 transition-colors text-sm"
              >
                Explorer les services
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/requests"
                className="inline-flex items-center justify-center bg-white/10 text-white border border-white/20 px-7 py-3.5 rounded-xl font-semibold hover:bg-white/15 transition-colors text-sm"
              >
                Voir les demandes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-neutral-100 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap gap-6 sm:gap-12 justify-center text-center">
            {[
              { value: "500+", label: "Prestataires" },
              { value: "2 000+", label: "Services publiés" },
              { value: "11", label: "Catégories" },
              { value: "24h", label: "Réponse moyenne" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
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
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-brand-600 text-xs font-semibold uppercase tracking-widest mb-2">
              Parcourir
            </p>
            <h2 className="text-3xl font-bold text-neutral-900">
              Nos catégories
            </h2>
          </div>
          <Link
            href="/services"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors hidden sm:inline"
          >
            Tout voir →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/services?category=${encodeURIComponent(cat.name)}`}
              className="group flex flex-col items-center gap-3 p-5 bg-white border border-neutral-200 rounded-2xl hover:border-brand-300 hover:bg-brand-50 transition-all"
            >
              <span className="text-2xl" role="img" aria-label={cat.name}>
                {cat.icon}
              </span>
              <span className="text-sm font-medium text-neutral-700 group-hover:text-brand-700 transition-colors text-center">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Split CTA */}
      <section className="border-t border-neutral-100">
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
                <p className="text-neutral-400 text-sm leading-relaxed">
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

            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-8 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="2" y="8" width="16" height="10" rx="2" stroke="white" strokeWidth="1.5" />
                  <path d="M7 8V6a3 3 0 0 1 6 0v2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">
                  Vous êtes prestataire ?
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed">
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
                <Link
                  href="/requests"
                  className="inline-flex items-center text-brand-700 px-5 py-3 rounded-xl text-sm font-medium border border-brand-200 hover:bg-brand-100 transition-colors w-fit"
                >
                  Voir les demandes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <p className="text-brand-600 text-xs font-semibold uppercase tracking-widest mb-2">
              Simple &amp; rapide
            </p>
            <h2 className="text-3xl font-bold text-neutral-900">
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
                <span className="text-4xl font-bold text-brand-200">{item.step}</span>
                <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="2" />
                <path d="M4 7h6M7 4v6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <span className="font-semibold text-neutral-900">{SITE_NAME}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-neutral-500">
            <Link href="/services" className="hover:text-neutral-900 transition-colors">Services</Link>
            <Link href="/requests" className="hover:text-neutral-900 transition-colors">Demandes</Link>
            <Link href="/auth/register" className="hover:text-neutral-900 transition-colors">S&apos;inscrire</Link>
          </div>
          <p className="text-xs text-neutral-400">
            Édité par{" "}
            <span className="text-neutral-600">{PARENT_COMPANY}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
