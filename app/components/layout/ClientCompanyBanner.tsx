"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import ClientProBadge from "@/components/profile/ClientProBadge";
import UserAvatar from "@/components/profile/UserAvatar";
import { isProfessionalClient } from "@/lib/client-kind";

export default function ClientCompanyBanner() {
  const { user } = useAuth();
  if (!isProfessionalClient(user) || !user) return null;

  const company = user.companyName?.trim() || user.name;

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-sm dark:border-slate-800">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <UserAvatar name={company} avatar={user.avatar} size="md" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-semibold tracking-tight">
                {company}
              </p>
              <ClientProBadge />
            </div>
            <p className="mt-0.5 text-sm text-slate-300">
              Compte entreprise · facturation et demandes au nom de la société
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/client/profile"
          className="inline-flex w-fit shrink-0 items-center rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
        >
          Fiche société
        </Link>
      </div>
    </div>
  );
}
