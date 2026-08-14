"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { isProfessionalClient } from "@/lib/client-kind";

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 8h10m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m14.5 6.5 3-3a4.5 4.5 0 0 1-5.8 5.8L5.5 15.5a2.1 2.1 0 0 0 3 3l6.2-6.2a4.5 4.5 0 0 1 5.8-5.8l-3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LearningIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3 7.5 9-4 9 4-9 4-9-4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 9.2v5.3c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3V9.2M21 8v6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function HomeHero() {
  const { user } = useAuth();

  if (!user) {
    return (
      <section className="border-b border-border bg-background text-foreground">
        <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 md:py-32 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              Marketplace de services — Madagascar
            </p>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl">
              Trouvez un prestataire{" "}
              <span className="text-brand-600 dark:text-brand-400">
                de confiance
              </span>
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Rapide, simple et sécurisé. Connectez-vous avec des prestataires
              qualifiés près de chez vous.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const dashboardHref =
    user.role === "CLIENT"
      ? "/dashboard/client"
      : user.role === "PROVIDER"
        ? "/dashboard/provider"
        : "/dashboard/admin";
  const roleLabel =
    user.role === "CLIENT"
      ? isProfessionalClient(user)
        ? "les prestations de votre société"
        : "vos réservations et demandes"
      : user.role === "PROVIDER"
        ? "votre activité de prestataire"
        : "l’administration";
  const helloName = isProfessionalClient(user)
    ? user.name
    : user.name.split(" ")[0];

  return (
    <section className="border-b border-border bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              Votre écosystème Tairo
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              Bonjour {helloName}
            </h1>
            <p className="mt-3 text-muted-foreground">
              Retrouvez vos services, louez du matériel et développez vos
              compétences depuis un seul compte.
            </p>
          </div>
          <Link
            href={dashboardHref}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Gérer {roleLabel}
            <ArrowIcon />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/ampindramo"
            className="group flex min-h-44 flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <ToolsIcon />
              </span>
              <span className="text-muted-foreground transition-transform group-hover:translate-x-1">
                <ArrowIcon />
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                Tairo ampindramo
              </p>
              <h2 className="mt-1 text-xl font-bold">Louer du matériel</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Trouvez l’outil adapté ou proposez votre propre matériel.
              </p>
            </div>
          </Link>

          <Link
            href="/ampianaro"
            className="group flex min-h-44 flex-col justify-between rounded-2xl border border-tertiary-300 bg-tertiary-50 p-6 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-tertiary-600 hover:shadow-card-hover dark:bg-tertiary-50/10"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-12 items-center justify-center rounded-xl bg-tertiary-200 text-tertiary-900 dark:bg-tertiary-400/20 dark:text-tertiary-300">
                <LearningIcon />
              </span>
              <span className="text-muted-foreground transition-transform group-hover:translate-x-1">
                <ArrowIcon />
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-tertiary-900 dark:text-tertiary-300">
                Tairo ampianaro
              </p>
              <h2 className="mt-1 text-xl font-bold">Suivre une formation</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Apprenez le bricolage, le DIY et les métiers techniques.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
