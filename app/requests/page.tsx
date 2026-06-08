"use client";

import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import PublicRequestsExplorer from "@/components/search/PublicRequestsExplorer";

function RequestsPageContent() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PublicRequestsExplorer />
    </div>
  );
}

export default function RequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <RequestsPageContent />
    </Suspense>
  );
}
