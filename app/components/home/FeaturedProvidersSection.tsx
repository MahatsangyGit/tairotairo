import Link from "next/link";
import UserAvatar from "@/components/profile/UserAvatar";
import ProviderRatingBadge from "@/components/search/ProviderRatingBadge";

export interface FeaturedProviderCard {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  serviceCount: number;
  averageRating: number | null;
  reviewCount: number;
}

export default function FeaturedProvidersSection({
  providers,
}: {
  providers: FeaturedProviderCard[];
}) {
  if (providers.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-12 border-t border-gray-100">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
            Sponsorisé
          </span>
          <h2 className="text-2xl font-bold text-gray-800 mt-1">Prestataires en avant</h2>
        </div>
        <Link href="/services" className="text-sm text-brand-600 font-medium hover:underline">
          Explorer →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {providers.map((provider) => (
          <Link
            key={provider.id}
            href={`/providers/${provider.id}`}
            className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm hover:shadow-md hover:border-amber-200 transition-all ring-1 ring-amber-50"
          >
            <span className="text-xs font-medium text-amber-700">★ En avant</span>
            <div className="flex items-center gap-3 mt-3">
              <UserAvatar name={provider.name} avatar={provider.avatar} size="md" />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{provider.name}</h3>
                <ProviderRatingBadge
                  averageRating={provider.averageRating}
                  reviewCount={provider.reviewCount}
                />
              </div>
            </div>
            {provider.bio && (
              <p className="text-sm text-gray-500 mt-3 line-clamp-2">{provider.bio}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {provider.serviceCount} annonce{provider.serviceCount !== 1 ? "s" : ""} en ligne
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
