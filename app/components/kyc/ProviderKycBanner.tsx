"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { KycStatusValue } from "@/lib/kyc";

export default function ProviderKycBanner() {
  const [status, setStatus] = useState<KycStatusValue | null>(null);

  useEffect(() => {
    fetch("/api/provider/kyc")
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.kyc?.status ?? null);
      })
      .catch(() => {});
  }, []);

  if (!status || status === "APPROVED") return null;

  if (status === "PENDING") {
    return (
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900">
        <strong>Vérification en cours.</strong> Votre dossier CIN est en attente de
        validation par notre équipe.
      </div>
    );
  }

  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900">
      <strong>Vérification d&apos;identité requise.</strong> Téléversez votre CIN
      (1 à 2 fichiers) dans{" "}
      <Link
        href="/dashboard/provider/profile"
        className="font-medium text-amber-800 underline"
      >
        Mon profil
      </Link>{" "}
      pour activer vos annonces et propositions.
    </div>
  );
}
