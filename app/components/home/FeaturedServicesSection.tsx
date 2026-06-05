import Link from "next/link";
import UserAvatar from "@/components/profile/UserAvatar";
import ProviderRatingBadge from "@/components/search/ProviderRatingBadge";

export interface FeaturedServiceCard {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  provider: {
    id: string;
    name: string;
    avatar: string | null;
    averageRating: number | null;
    reviewCount: number;
  };
}

export default function FeaturedServicesSection({
  services,
}: {
  services: FeaturedServiceCard[];
}) {
  if (services.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Annonces du moment</h2>
        </div>
        <Link href="/services" className="text-sm text-brand-600 font-medium hover:underline">
          Toutes les annonces →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service) => (
          <Link
            key={service.id}
            href={`/services/${service.id}`}
            className="bg-white rounded-2xl border border-amber-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all overflow-hidden ring-1 ring-amber-50"
          >
            <div className="p-4">
              <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                {service.category}
              </span>
              <h3 className="font-semibold text-gray-800 mt-2 line-clamp-2">
                {service.title}
              </h3>
              <p className="text-brand-600 font-bold text-sm mt-2">
                {service.price.toLocaleString("fr-MG")} Ar
              </p>
              <p className="text-gray-400 text-xs mt-1">📍 {service.location}</p>
              <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar
                    name={service.provider.name}
                    avatar={service.provider.avatar}
                    size="xs"
                  />
                  <span className="text-xs text-gray-600 truncate">
                    {service.provider.name}
                  </span>
                </div>
                <ProviderRatingBadge
                  averageRating={service.provider.averageRating}
                  reviewCount={service.provider.reviewCount}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
