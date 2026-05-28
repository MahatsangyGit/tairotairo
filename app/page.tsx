import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

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
  { name: "Iraka", icon: "🏠"},
  { name: "Evénementiel", icon: "🎉"},
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-emerald-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Trouvez un prestataire de confiance
          </h1>
          <p className="text-emerald-100 text-lg mb-8">
            La marketplace de services à Madagascar — rapide, simple et sécurisé
          </p>
          <Link
            href="/services"
            className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-emerald-50 transition-colors inline-block"
          >
            Voir les services
          </Link>
        </div>
      </section>

      {/* Catégories */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
          Nos catégories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/services?category=${cat.name}`}
              className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md hover:border-emerald-500 border border-gray-100 transition-all"
            >
              <span className="text-3xl mb-2 block">{cat.icon}</span>
              <span className="text-gray-700 font-medium">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-50 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Vous êtes prestataire ?
          </h2>
          <p className="text-gray-600 mb-6">
            Rejoignez TairoTairo et trouvez des clients près de chez vous
          </p>
          <Link
            href="/auth/register"
            className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors inline-block"
          >
            Devenir prestataire
          </Link>
        </div>
      </section>
    </div>
  );
}