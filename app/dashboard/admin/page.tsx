"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push("/auth/login?callbackUrl=/dashboard/admin");
          return;
        }
        if (data.user.role !== "ADMIN") {
          router.push(
            data.user.role === "PROVIDER"
              ? "/dashboard/provider"
              : "/dashboard/client"
          );
          return;
        }
        setAllowed(true);
      })
      .catch(() => router.push("/auth/login?callbackUrl=/dashboard/admin"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-neutral-800 mb-1">Administration</h1>
        <p className="text-neutral-500 text-sm mb-8">
          Statistiques de la plateforme, exports CSV et gestion des abonnements
        </p>
        {loading && <p className="text-neutral-500">Vérification des droits…</p>}
        {allowed && <AdminDashboard />}
      </div>
    </div>
  );
}
