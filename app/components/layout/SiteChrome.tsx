"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbar = pathname.startsWith("/dashboard");

  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
    </>
  );
}
