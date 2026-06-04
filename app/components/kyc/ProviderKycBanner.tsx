"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProviderKycBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch("/api/provider/kyc")
      .then((r) => r.json())
      .then((data) => {
        if (data.kyc?.status !== "APPROVED") {
          setShow(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900">
      <strong>Vérification d&apos;identité requise.</strong> Téléversez votre CIN
      (1 à 2 fichiers) et votre certificat de résidence dans{" "}
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
