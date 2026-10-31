"use client";

import Link from "next/link";
import { SUBSCRIPTION_PERIOD_DAYS } from "@/lib/subscription";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { MapPinIcon } from "@/components/ui/app-icons";
import ServiceCommissionHint from "@/components/economy/ServiceCommissionHint";

export interface ProviderServiceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  coverImageMime: string | null;
  coverImageUrl: string | null;
  available: boolean;
  featuredOnHomepage: boolean;
  createdAt: string;
}

export interface SpotlightState {
  providerFeatured: boolean;
  canFeature: boolean;
  featuredService: { id: string; title: string } | null;
}

export type SubscriptionState = {
  expiresAt: string;
  isActive: boolean;
} | null;

export function ProviderSpotlightBanner({
  subscription,
  spotlight,
}: {
  subscription: SubscriptionState;
  spotlight: SpotlightState | null;
}) {
  if (subscription?.isActive && spotlight?.canFeature) {
    return (
      <div className="mb-6 bg-brand-50 border border-brand-100 rounded-xl px-4 py-4 text-sm text-brand-900">
        <p className="font-medium">Abonnement actif — mise en avant automatique</p>
        <p className="text-brand-800 mt-1">
          Votre profil apparaît dans « Nos prestataires du mois » sur l&apos;accueil
          jusqu&apos;au {new Date(subscription.expiresAt).toLocaleDateString("fr-MG")}.
          Choisissez une annonce en ligne à mettre en avant dans « Annonces du moment ».
        </p>
      </div>
    );
  }

  if (subscription?.isActive && !spotlight?.canFeature) {
    return (
      <div className="mb-6 bg-amber-50 border border-amber-100 rounded-xl px-4 py-4 text-sm text-amber-900">
        <p className="font-medium">Abonnement actif</p>
        <p className="mt-1">
          Complétez la vérification d&apos;identité (KYC) pour activer la mise en
          avant sur l&apos;accueil.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-muted/40 border border-border rounded-xl px-4 py-4 text-sm text-muted-foreground">
      <p>
        L&apos;abonnement mensuel ({SUBSCRIPTION_PERIOD_DAYS} jours) met votre
        profil en avant sur l&apos;accueil et dans les suggestions.{" "}
        <Link
          href="/dashboard/provider/subscription"
          className="text-brand-600 font-medium hover:underline"
        >
          Souscrire maintenant →
        </Link>
      </p>
    </div>
  );
}

export function ProviderServiceCard({
  service,
  canFeature,
  spotlightBusyId,
  onEdit,
  onToggleAvailable,
  onToggleFeatured,
  onDelete,
}: {
  service: ProviderServiceItem;
  canFeature: boolean;
  spotlightBusyId: string | null;
  onEdit: (service: ProviderServiceItem) => void;
  onToggleAvailable: (service: ProviderServiceItem) => void;
  onToggleFeatured: (service: ProviderServiceItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 p-6">
        {service.coverImageUrl ? (
          <OptimizedImage
            src={service.coverImageUrl}
            alt={service.title}
            width={128}
            height={128}
            sizes="128px"
            className="w-full sm:w-32 sm:h-32 h-40 object-cover rounded-xl bg-muted shrink-0"
          />
        ) : (
          <div className="w-full sm:w-32 sm:h-32 h-40 rounded-xl bg-muted/60 border border-dashed border-border flex items-center justify-center shrink-0">
            <span className="text-xs text-muted-foreground text-center px-2">
              Aucune photo
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0">
              <span className="inline-block bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full mb-2">
                {service.category}
              </span>
              <h3 className="font-semibold text-foreground">{service.title}</h3>
              <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                {service.description}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  service.available
                    ? "bg-brand-50 text-brand-700 border-brand-200"
                    : "bg-muted/40 text-muted-foreground border-border"
                }`}
              >
                {service.available ? "En ligne" : "Hors ligne"}
              </span>
              {service.featuredOnHomepage && (
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  En avant sur l&apos;accueil
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="text-brand-600 font-bold">
              {service.price.toLocaleString("fr-MG")} Ar
            </span>
            <span>
              <MapPinIcon /> {service.location}
            </span>
            <Link href={`/services/${service.id}`} className="text-brand-600 hover:underline">
              Voir la fiche publique →
            </Link>
          </div>
          <ServiceCommissionHint
            className="mt-3"
            category={service.category}
            price={service.price}
            variant="compact"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 px-6 pb-6 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => onEdit(service)}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:border-brand-400"
        >
          Modifier
        </button>
        <button
          type="button"
          onClick={() => onToggleAvailable(service)}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:border-brand-400"
        >
          {service.available ? "Désactiver" : "Réactiver"}
        </button>
        {canFeature && service.available && (
          <button
            onClick={() => onToggleFeatured(service)}
            disabled={spotlightBusyId != null}
            className={`px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-50 ${
              service.featuredOnHomepage
                ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                : "border-brand-200 text-brand-700 hover:bg-brand-50"
            }`}
          >
            {spotlightBusyId === service.id
              ? "…"
              : service.featuredOnHomepage
                ? "Retirer de l'accueil"
                : "Mettre en avant sur l'accueil"}
          </button>
        )}
        <button
          onClick={() => onDelete(service.id)}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
