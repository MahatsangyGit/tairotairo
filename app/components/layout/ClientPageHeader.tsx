"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import ClientProBadge from "@/components/profile/ClientProBadge";
import { isProfessionalClient } from "@/lib/client-kind";

export default function ClientPageHeader({
  subtitle,
  title,
}: {
  subtitle: string;
  title?: string;
}) {
  const { user } = useAuth();
  const professional = isProfessionalClient(user);
  const heading =
    title ?? (professional ? "Espace entreprise" : "Espace client");

  return (
    <div className="mb-2">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
        {professional ? <ClientProBadge /> : null}
      </div>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
