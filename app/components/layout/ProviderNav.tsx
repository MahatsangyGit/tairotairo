"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard/provider", label: "Réservations" },
  { href: "/dashboard/provider/services", label: "Mes annonces" },
  { href: "/dashboard/provider/proposals", label: "Mes propositions" },
  { href: "/dashboard/provider/profile", label: "Mon profil" },
  { href: "/requests", label: "Demandes clients" },
];

export default function ProviderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 mb-8 border-b border-gray-200">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
