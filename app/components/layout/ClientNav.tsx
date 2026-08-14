"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { isProfessionalClient } from "@/lib/client-kind";
import { isNavLinkActive } from "@/lib/nav-active";

export default function ClientNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const professional = isProfessionalClient(user);

  const links = [
    { href: "/dashboard/client", label: professional ? "Prestations" : "Mes réservations" },
    { href: "/dashboard/client/requests", label: professional ? "Appels d'offres" : "Mes demandes" },
    { href: "/dashboard/client/messages", label: "Messages" },
    ...(professional
      ? [{ href: "/dashboard/client/profile", label: "Entreprise" }]
      : [{ href: "/dashboard/client/profile", label: "Profil" }]),
  ];

  return (
    <nav className="mb-8 flex gap-1 border-b border-border">
      {links.map((link) => {
        const active = isNavLinkActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-brand-600 text-brand-600 dark:text-brand-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
