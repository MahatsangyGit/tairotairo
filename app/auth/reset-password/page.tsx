"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { SITE_NAME } from "@/lib/site";

function readResetTokenFromLocation(): string {
  if (typeof window === "undefined") return "";

  const fromHash = new URLSearchParams(
    window.location.hash.replace(/^#/, "")
  )
    .get("token")
    ?.trim();

  if (fromHash) return fromHash;

  return (
    new URLSearchParams(window.location.search).get("token")?.trim() ?? ""
  );
}

function clearTokenFromAddressBar(): void {
  if (typeof window === "undefined" || !window.history.replaceState) return;
  window.history.replaceState(null, "", window.location.pathname);
}

function ResetPasswordContent() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [tokenReady, setTokenReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const value = readResetTokenFromLocation();
    setToken(value);
    setTokenReady(true);
    if (value) {
      clearTokenFromAddressBar();
    }
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (!token) {
      setError("Lien invalide. Demandez un nouvel email de réinitialisation.");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue");
        return;
      }

      router.push("/auth/login?reset=success");
      router.refresh();
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (!tokenReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-card rounded-2xl shadow-sm p-8 border border-border text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Lien invalide
            </h1>
            <p className="text-muted-foreground mb-6">
              Ce lien de réinitialisation est incomplet ou a expiré.
            </p>
            <Link
              href="/auth/forgot-password"
              className="text-brand-600 font-medium hover:underline"
            >
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-card rounded-2xl shadow-sm p-8 border border-border">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Nouveau mot de passe
          </h1>
          <p className="text-muted-foreground mb-6">
            Choisissez un nouveau mot de passe pour votre compte {SITE_NAME}.
          </p>

          <div className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Nouveau mot de passe (8 caractères min.)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-brand-500"
            />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-brand-500"
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
            </button>
          </div>

          <p className="text-center text-muted-foreground mt-6">
            <Link
              href="/auth/login"
              className="text-brand-600 font-medium hover:underline"
            >
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
