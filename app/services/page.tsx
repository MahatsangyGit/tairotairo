"use client";

import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import PublicServicesExplorer from "@/components/search/PublicServicesExplorer";

function ServicesPageContent() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PublicServicesExplorer />
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ServicesPageContent />
    </Suspense>
  );
}
