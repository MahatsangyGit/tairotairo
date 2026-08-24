"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { isProfessionalClient } from "@/lib/client-kind";

export default function AmpianaroB2bOffer() {
  const { user } = useAuth();
  if (!isProfessionalClient(user)) return null;

  return (
    <aside className="mb-10 rounded-2xl border border-brand-200 bg-brand-50/70 p-5 dark:border-brand-800 dark:bg-brand-950/30">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-700 dark:text-brand-300">
        Offre professionnels
      </p>
      <h2 className="mt-1 text-lg font-semibold text-foreground">
        Diffusez vos formations sur Tairo ampianaro
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Mise en ligne de vos vidéos d&apos;apprentissage, gérée avec notre équipe.
        Paiement hors plateforme. Contactez Tairo pour en discuter.
      </p>
    </aside>
  );
}
