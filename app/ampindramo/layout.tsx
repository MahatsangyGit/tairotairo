import Link from "next/link";
import type { Metadata } from "next";
import MarketplaceHomeLink from "@/components/layout/MarketplaceHomeLink";

export const metadata: Metadata = {
  title: "Tairo ampindramo — Location de matériel",
  description:
    "Empruntez du matériel utile pour vos services : outillage, électricité, bricolage. Catalogue Tairo et prêt entre particuliers.",
};

export default function AmpindramoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/ampindramo"
              className="text-lg font-bold tracking-tight text-brand-600 dark:text-brand-400"
            >
              Tairo ampindramo
            </Link>
            <nav className="hidden items-center gap-4 text-sm sm:flex">
              <Link
                href="/ampindramo"
                className="text-muted-foreground hover:text-foreground"
              >
                Catalogue
              </Link>
              <Link
                href="/ampindramo/publier"
                className="text-muted-foreground hover:text-foreground"
              >
                Publier
              </Link>
              <Link
                href="/ampindramo/mes-locations"
                className="text-muted-foreground hover:text-foreground"
              >
                Mes locations
              </Link>
            </nav>
          </div>
          <MarketplaceHomeLink />
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
        <Link href="/cgu" className="hover:text-foreground">
          CGU
        </Link>
      </footer>
    </div>
  );
}
