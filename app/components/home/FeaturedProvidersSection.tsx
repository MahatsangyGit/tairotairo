"use client";

import Link from "next/link";
import GuestBrowseTrigger from "@/components/auth/GuestBrowseTrigger";
import EntrepriseIndividuelleBadge from "@/components/profile/EntrepriseIndividuelleBadge";
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
  isEntrepriseIndividuelle?: boolean;
}

export default function FeaturedProvidersSection({
  providers,
}: {
  providers: FeaturedProviderCard[];
}) {
  if (providers.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Nos prestataires du mois
          </h2>
        </div>
        <GuestBrowseTrigger
          browse="services"
          className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors hidden sm:inline"
        >
          Explorer →
        </GuestBrowseTrigger>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {providers.map((provider) => (
          <Link
            key={provider.id}
            href={`/providers/${provider.id}`}
            className="group bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md hover:border-brand-200 transition-all"
          >
            <div className="flex items-center gap-3">
              <UserAvatar name={provider.name} avatar={provider.avatar} size="md" />
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-brand-700 transition-colors flex items-center gap-1.5 min-w-0">
                  <span className="truncate">{provider.name}</span>
                  {provider.isEntrepriseIndividuelle ? (
                    <EntrepriseIndividuelleBadge />
                  ) : null}
                </h3>
                <ProviderRatingBadge
                  averageRating={provider.averageRating}
                  reviewCount={provider.reviewCount}
                />
              </div>
            </div>
            {provider.bio && (
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                {provider.bio}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {provider.serviceCount} annonce{provider.serviceCount !== 1 ? "s" : ""}{" "}
              en ligne
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
