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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="bg-brand-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Trouvez un prestataire de confiance
          </h1>
          <p className="text-brand-100 text-lg mb-8">
            La marketplace d&apos;entraide à Madagascar — rapide, simple et sécurisé
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/services"
              className="bg-white text-brand-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-brand-50 transition-colors inline-block"
            >
              Voir les services
            </Link>
            <Link
              href="/requests"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors inline-block"
            >
              Voir les demandes
            </Link>
          </div>
        </div>
      </section>

      {hasFeatured && (
        <section className="bg-gradient-to-b from-amber-50/80 to-gray-50 pt-4">
          <FeaturedServicesSection services={featuredServices} />
          <FeaturedProvidersSection providers={featuredProviders} />
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
          Nos catégories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/services?category=${cat.name}`}
              className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md hover:border-brand-500 border border-gray-100 transition-all"
            >
              <span className="text-3xl mb-2 block">{cat.icon}</span>
              <span className="text-gray-700 font-medium">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-brand-50 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Vous cherchez un prestataire ?
          </h2>
          <p className="text-gray-600 mb-6">
            Publiez une annonce de demande et recevez des propositions
          </p>
          <Link
            href="/dashboard/client/requests"
            className="bg-brand-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors inline-block"
          >
            Publier une demande
          </Link>
        </div>
      </section>

      <section className="bg-white py-16 px-4 border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Vous êtes prestataire ?
          </h2>
          <p className="text-gray-600 mb-6">
            Rejoignez {SITE_NAME} et trouvez des clients près de chez vous. Un
            abonnement mensuel peut mettre votre profil et vos annonces en avant
            sur l&apos;accueil (sur décision de l&apos;équipe).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/register"
              className="bg-brand-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors inline-block"
            >
              Devenir prestataire
            </Link>
            <Link
              href="/requests"
              className="bg-white text-brand-600 border border-brand-200 px-8 py-3 rounded-lg font-semibold hover:bg-brand-50 transition-colors inline-block"
            >
              Voir les demandes clients
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg font-semibold text-brand-600">{SITE_NAME}</p>
          <p className="text-sm text-gray-500 mt-2">
            Plateforme éditée par{" "}
            <span className="font-medium text-gray-700">{PARENT_COMPANY}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
