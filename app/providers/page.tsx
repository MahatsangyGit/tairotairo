import type { Metadata } from "next";
import Link from "next/link";
import JsonLdScripts from "@/components/seo/JsonLdScripts";
import UserAvatar from "@/components/profile/UserAvatar";
import { loadVerifiedProvidersDirectory } from "@/lib/provider-list-search";
import { providersListMetadata } from "@/lib/seo";
import { SEO_SCHEMA_PATHS } from "@/lib/seo-schema-routes";
import { StarIcon } from "@/components/ui/app-icons";
import EntrepriseIndividuelleBadge from "@/components/profile/EntrepriseIndividuelleBadge";

export const metadata: Metadata = providersListMetadata();

// Doit être un littéral statique (voir PAGE_REVALIDATE_SECONDS.PROVIDERS).
export const revalidate = 300;

export default async function ProvidersPage() {
  const providers = await loadVerifiedProvidersDirectory();

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScripts paths={SEO_SCHEMA_PATHS.providersList} />

      <section className="bg-neutral-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold mb-2">Prestataires vérifiés</h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Découvrez les professionnels identité vérifiée qui proposent leurs
            services à Madagascar.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {providers.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">
            Aucun prestataire disponible pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <Link
                key={provider.id}
                href={`/providers/${provider.id}`}
                className="group bg-card rounded-2xl border border-border p-5 hover:shadow-md hover:border-brand-200 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <UserAvatar
                    name={provider.name}
                    avatar={provider.avatar}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <h2 className="font-semibold text-foreground group-hover:text-brand-700 transition-colors flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{provider.name}</span>
                      {provider.isEntrepriseIndividuelle ? (
                        <EntrepriseIndividuelleBadge />
                      ) : null}
                    </h2>
                    {provider.category && (
                      <p className="text-xs text-muted-foreground truncate">
                        {provider.category}
                        {provider.location ? ` · ${provider.location}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                {provider.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {provider.bio}
                  </p>
                )}
                {provider.reviewCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    <StarIcon className="text-amber-500" /> {provider.averageRating} ({provider.reviewCount} avis)
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
