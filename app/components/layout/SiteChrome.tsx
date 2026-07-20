"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

function isVerticalPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === "/ampindramo" ||
    pathname.startsWith("/ampindramo/") ||
    pathname === "/ampianaro" ||
    pathname.startsWith("/ampianaro/")
  );
}

/** Marketplace chrome; vertical apps provide their own nav in nested layouts. */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideMarketplaceNav = isVerticalPath(pathname);

  return (
    <>
      {!hideMarketplaceNav ? <Navbar /> : null}
      {children}
    </>
  );
}
