"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavLinkActive } from "@/lib/nav-active";

const LINKS = [
  { href: "/dashboard/client", label: "Mes réservations" },
  { href: "/dashboard/client/requests", label: "Mes demandes" },
  { href: "/dashboard/client/messages", label: "Messages" },
];

export default function ClientNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 mb-8 border-b border-border">
      {LINKS.map((link) => {
        const active = isNavLinkActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
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
