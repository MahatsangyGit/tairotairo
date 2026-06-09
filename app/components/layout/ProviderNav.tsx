"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavLinkActive } from "@/lib/nav-active";

const LINKS = [
  { href: "/dashboard/provider", label: "Réservations" },
  { href: "/dashboard/provider/services", label: "Mes annonces" },
  { href: "/dashboard/provider/proposals", label: "Mes propositions" },
  { href: "/dashboard/provider/messages", label: "Messages" },
  { href: "/dashboard/provider/portfolio", label: "Mon portfolio" },
  { href: "/dashboard/provider/subscription", label: "Abonnement" },
];

export default function ProviderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 mb-8 border-b border-border overflow-x-auto">
      {LINKS.map((link) => {
        const active = isNavLinkActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
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
