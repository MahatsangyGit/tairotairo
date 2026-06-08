"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard/provider", label: "Réservations" },
  { href: "/dashboard/provider/services", label: "Mes annonces" },
  { href: "/dashboard/provider/proposals", label: "Mes propositions" },
  { href: "/dashboard/provider/portfolio", label: "Mon portfolio" },
  { href: "/dashboard/provider/subscription", label: "Abonnement" },
];

export default function ProviderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 mb-8 border-b border-neutral-200 overflow-x-auto">
      {LINKS.map((link) => {
        const isRoot = link.href === "/dashboard/provider";
        const active = isRoot
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              active
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
