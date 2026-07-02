"use client";

import GuestBrowseTrigger from "@/components/auth/GuestBrowseTrigger";
import UserAvatar from "@/components/profile/UserAvatar";
import ProviderRatingBadge from "@/components/search/ProviderRatingBadge";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { MapPinIcon } from "@/components/ui/app-icons";

export interface FeaturedServiceCard {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  coverImageUrl: string | null;
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
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Annonces du moment</h2>
        </div>
        <GuestBrowseTrigger
          browse="services"
          className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors hidden sm:inline"
        >
          Toutes les annonces →
        </GuestBrowseTrigger>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service) => (
          <GuestBrowseTrigger
            key={service.id}
            browse="services"
            href={`/services/${service.id}`}
            className="group bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-brand-200 transition-all overflow-hidden text-left"
          >
            {service.coverImageUrl && (
              <div className="relative w-full h-28 bg-muted">
                <OptimizedImage
                  src={service.coverImageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                />
              </div>
            )}
            <div className="p-4">
              <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                {service.category}
              </span>
              <h3 className="font-semibold text-foreground mt-2 line-clamp-2 group-hover:text-brand-700 transition-colors">
                {service.title}
              </h3>
              <p className="text-brand-600 font-bold text-sm mt-2">
                {service.price.toLocaleString("fr-MG")} Ar
              </p>
              <p className="text-muted-foreground text-xs mt-1"><MapPinIcon /> {service.location}</p>
              <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar
                    name={service.provider.name}
                    avatar={service.provider.avatar}
                    size="xs"
                  />
                  <span className="text-xs text-muted-foreground truncate">
                    {service.provider.name}
                  </span>
                </div>
                <ProviderRatingBadge
                  averageRating={service.provider.averageRating}
                  reviewCount={service.provider.reviewCount}
                />
              </div>
            </div>
          </GuestBrowseTrigger>
        ))}
      </div>
    </section>
  );
}
