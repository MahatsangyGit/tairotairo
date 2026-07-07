"use client";

import Navbar from "@/components/layout/Navbar";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
