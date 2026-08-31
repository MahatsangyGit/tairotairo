import Link from "next/link";
import { IconBriefcase, IconBuilding, IconUser } from "@tabler/icons-react";
import { HomeProviderBrowseCta } from "@/components/home/HomeGuestBrowse";
import { SITE_NAME } from "@/lib/site";

const ACCOUNT_CARDS = [
  {
    href: "/auth/register",
    title: "Particulier",
    description: "Je cherche un prestataire près de chez moi.",
    icon: IconUser,
  },
  {
    href: "/auth/register?role=PROVIDER",
    title: "Prestataire",
    description: "Je propose mes services et développe mon activité.",
    icon: IconBriefcase,
  },
  {
    href: "/auth/register?type=pro",
    title: "Entreprise",
    description: "Je réserve des prestations pour ma société.",
    icon: IconBuilding,
  },
] as const;

export default function HomeBecomeProvider() {
  return (
    <section className="border-t border-border bg-tertiary-50/70 dark:bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-brand-600 text-xs font-semibold uppercase tracking-widest mb-2">
              Rejoindre {SITE_NAME}
            </p>
            <h2 className="text-3xl font-bold text-foreground">
              Devenez prestataire sur {SITE_NAME}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Inscrivez-vous, trouvez de nouveaux clients et commencez à
              développer votre activité dès maintenant. Le paiement des
              réservations passe par un séquestre.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {ACCOUNT_CARDS.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand-300 hover:bg-background"
                >
                  <card.icon
                    size={22}
                    stroke={1.8}
                    className="text-brand-700"
                    aria-hidden
                  />
                  <p className="mt-3 font-semibold text-foreground">
                    {card.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/client/requests"
                className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
              >
                Publier une demande
              </Link>
              <HomeProviderBrowseCta />
            </div>
          </div>

          <div
            className="rounded-3xl border border-border bg-card p-6 shadow-card"
            aria-hidden="true"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Aperçu de l’espace prestataire
            </p>
            <p className="mt-4 text-sm text-muted-foreground">Gains du mois</p>
            <p className="text-3xl font-bold text-foreground">— Ar</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Illustration — les montants réels s’affichent après vos
              premières missions.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
                <span className="text-sm text-foreground">Nouveau job</span>
                <span className="text-xs font-medium text-brand-700">
                  En attente
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
                <span className="text-sm text-foreground">Paiement</span>
                <span className="text-xs font-medium text-muted-foreground">
                  Sous séquestre
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
