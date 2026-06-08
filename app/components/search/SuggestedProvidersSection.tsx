import Link from "next/link";
import UserAvatar from "@/components/profile/UserAvatar";
import ProviderRatingBadge from "@/components/search/ProviderRatingBadge";
import { SITE_NAME } from "@/lib/site";

export interface SuggestedProvider {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  serviceCount: number;
  averageRating: number | null;
  reviewCount: number;
}

export default function SuggestedProvidersSection({
  providers,
}: {
  providers: SuggestedProvider[];
}) {
  if (providers.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-1">Nos suggestions</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Prestataires partenaires avec abonnement actif sur {SITE_NAME}.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {providers.map((provider) => (
          <Link
            key={provider.id}
            href={`/providers/${provider.id}`}
            className="bg-card rounded-xl border border-brand-100 p-4 hover:shadow-md hover:border-brand-200 transition-all ring-1 ring-brand-50"
          >
            <div className="flex items-start gap-3">
              <UserAvatar
                name={provider.name}
                avatar={provider.avatar}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground truncate">
                  {provider.name}
                </h3>
                <ProviderRatingBadge
                  averageRating={provider.averageRating}
                  reviewCount={provider.reviewCount}
                />
                {provider.bio && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {provider.bio}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {provider.serviceCount} annonce
                  {provider.serviceCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
