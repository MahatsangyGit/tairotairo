"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard/client", label: "Mes réservations" },
  { href: "/dashboard/client/requests", label: "Mes demandes" },
  { href: "/dashboard/client/messages", label: "Messages" },
];

export default function ClientNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 mb-8 border-b border-neutral-200">
      {LINKS.map((link) => {
        const isRoot = link.href === "/dashboard/client";
        const active = isRoot
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
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
