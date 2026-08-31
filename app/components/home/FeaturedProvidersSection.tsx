"use client";

import Link from "next/link";
import GuestBrowseTrigger from "@/components/auth/GuestBrowseTrigger";
import EntrepriseIndividuelleBadge from "@/components/profile/EntrepriseIndividuelleBadge";
import UserAvatar from "@/components/profile/UserAvatar";
import ProviderRatingBadge from "@/components/search/ProviderRatingBadge";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { formatMgaAmount } from "@/lib/economy";

export interface FeaturedProviderCard {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  serviceCount: number;
  averageRating: number | null;
  reviewCount: number;
  isEntrepriseIndividuelle?: boolean;
  category: string | null;
  price: number | null;
  location: string | null;
  coverImageUrl: string | null;
}

function bioTags(bio: string | null): string[] {
  if (!bio) return [];
  return bio
    .split(/[,;·•\n]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 8 && part.length <= 36)
    .slice(0, 3);
}

function isTopProvider(averageRating: number | null, reviewCount: number) {
  return averageRating != null && averageRating >= 4.5 && reviewCount >= 5;
}

export default function FeaturedProvidersSection({
  providers,
}: {
  providers: FeaturedProviderCard[];
}) {
  if (providers.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-brand-600 text-xs font-semibold uppercase tracking-widest mb-2">
            Prestataires évalués
          </p>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Trouvez le prestataire qui vous convient
          </h2>
        </div>
        <GuestBrowseTrigger
          browse="services"
          href="/providers"
          className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors hidden sm:inline"
        >
          Voir tous →
        </GuestBrowseTrigger>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
        {providers.map((provider) => {
          const tags = bioTags(provider.bio);
          const top = isTopProvider(
            provider.averageRating,
            provider.reviewCount
          );
          return (
            <Link
              key={provider.id}
              href={`/providers/${provider.id}`}
              className="group min-w-[240px] snap-start overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-brand-200 hover:shadow-md lg:min-w-0"
            >
              <div className="relative h-44 bg-brand-50 dark:bg-brand-900/30">
                {provider.coverImageUrl ? (
                  <OptimizedImage
                    src={provider.coverImageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 240px, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <UserAvatar
                      name={provider.name}
                      avatar={provider.avatar}
                      size="xl"
                    />
                  </div>
                )}
                {top ? (
                  <span className="absolute left-3 top-3 rounded-full bg-neutral-950/85 px-2.5 py-1 text-[11px] font-semibold text-white">
                    Top prestataire
                  </span>
                ) : (
                  <span className="absolute left-3 top-3 rounded-full bg-brand-600/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                    À la une
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 font-semibold text-foreground group-hover:text-brand-700">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate">{provider.name}</span>
                      {provider.isEntrepriseIndividuelle ? (
                        <EntrepriseIndividuelleBadge />
                      ) : null}
                    </span>
                  </h3>
                  {provider.price != null ? (
                    <p className="shrink-0 text-sm font-bold text-brand-700 dark:text-brand-400">
                      {formatMgaAmount(provider.price)}
                    </p>
                  ) : null}
                </div>
                {provider.category ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {provider.category}
                    {provider.location ? ` · ${provider.location}` : ""}
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {provider.serviceCount} annonce
                    {provider.serviceCount !== 1 ? "s" : ""} en ligne
                  </p>
                )}
                <div className="mt-2">
                  <ProviderRatingBadge
                    averageRating={provider.averageRating}
                    reviewCount={provider.reviewCount}
                  />
                </div>
                {tags.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
