import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import {
  formatCommissionPercent,
  RENTAL_PARTICULAR_COMMISSION_RATE,
  RENTAL_PRO_TIERS,
  SERVICE_COMMISSION_ROWS,
} from "@/lib/economy";
import { SUBSCRIPTION_MONTHLY_PRICE_MGA } from "@/lib/subscription-plans";

export const metadata: Metadata = {
  title: `Conditions générales — ${SITE_NAME}`,
  description: `Commissions, abonnement et règles tarifaires de ${SITE_NAME}.`,
};

export default function CguPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
        Documents
      </p>
      <h1 className="mt-2 text-3xl font-bold">Conditions générales d&apos;utilisation</h1>
      <p className="mt-3 text-muted-foreground">
        Tarifs et commissions appliqués sur {SITE_NAME}, Tairo ampindramo et
        Tairo ampianaro. Les taux de commission d&apos;une réservation ou d&apos;une
        location sont figés au moment de sa création.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Abonnement prestataire</h2>
        <p>
          L&apos;abonnement est optionnel. Il coûte{" "}
          <strong>
            {SUBSCRIPTION_MONTHLY_PRICE_MGA.toLocaleString("fr-MG")} Ar
          </strong>{" "}
          par mois (30 jours) et sert à la mise en avant (accueil, suggestions,
          annonce en avant). Il n&apos;est pas obligatoire pour publier des
          services ou recevoir des réservations.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Commissions sur les services</h2>
        <p>
          Le client paie le prix affiché ou négocié. La commission Tairo est
          prélevée sur le prestataire au versement. Le prestataire voit le
          pourcentage dans son espace ; le client ne voit que le prix convenu.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-3 py-2 font-medium">Catégorie</th>
                <th className="px-3 py-2 font-medium">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SERVICE_COMMISSION_ROWS.map((row) => (
                <tr key={row.category}>
                  <td className="px-3 py-2">{row.category}</td>
                  <td className="px-3 py-2">
                    {formatCommissionPercent(row.rate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Commissions sur les locations</h2>
        <p>
          L&apos;emprunteur paie le loyer affiché par le propriétaire. La
          commission est prélevée sur le loueur. La caution est optionnelle et
          n&apos;est jamais commissionnée.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>
            Particulier : {formatCommissionPercent(RENTAL_PARTICULAR_COMMISSION_RATE)}{" "}
            du loyer.
          </li>
          {RENTAL_PRO_TIERS.map((tier) => (
            <li key={tier.label}>
              Client professionnel : {formatCommissionPercent(tier.rate)}{" "}
              {tier.label}.
            </li>
          ))}
          <li>
            Matériel catalogue Tairo : 0 %. Le loyer est versé sur le compte
            Mobile Money de Tairo.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Tairo ampianaro</h2>
        <p>
          Les vidéos du catalogue sont visibles avec un compte client ou
          prestataire. La mise en ligne des formations est gérée par
          l&apos;équipe Tairo. Une offre dédiée aux professionnels est proposée
          hors de cette page ; le paiement éventuel se fait hors plateforme.
        </p>
      </section>

      <p className="mt-12 text-sm text-muted-foreground">
        <Link href="/" className="text-brand-600 hover:underline">
          Retour à l&apos;accueil
        </Link>
      </p>
    </div>
  );
}
