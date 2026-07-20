import Link from "next/link";
import type { Metadata } from "next";
import { getMarketplaceOrigin } from "@/lib/origins";

export const metadata: Metadata = {
  title: "Tairo ampianaro — Formations en ligne",
  description:
    "Formations DIY, bricolage et électricité pour les prestataires Tairo ampio abonnés.",
};

export default function AmpianaroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const marketplace = getMarketplaceOrigin();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/ampianaro"
              className="text-lg font-bold tracking-tight text-brand-600 dark:text-brand-400"
            >
              Tairo ampianaro
            </Link>
            <nav className="hidden text-sm sm:block">
              <Link
                href="/ampianaro"
                className="text-muted-foreground hover:text-foreground"
              >
                Formations
              </Link>
            </nav>
          </div>
          <a
            href={marketplace}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Tairo ampio
          </a>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
