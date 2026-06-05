"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { SITE_NAME } from "@/lib/site";

function safeCallbackUrl(url: string | null): string | null {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return null;
  return url;
}

interface FormData {
  email: string;
  password: string;
}

interface UserResponse {
  id:    string;
  name:  string;
  email: string;
  role:  "CLIENT" | "PROVIDER" | "ADMIN";
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const resetSuccess = searchParams.get("reset") === "success";

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      const user: UserResponse = data.user;

      if (callbackUrl) {
        router.push(callbackUrl);
      } else if (user.role === "PROVIDER") {
        router.push("/dashboard/provider");
      } else if (user.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/client");
      }

      router.refresh();
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 mb-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="2" />
                <path d="M7 11h8M11 7v8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Connexion</h1>
            <p className="text-neutral-500 text-sm mt-1">Bienvenue sur {SITE_NAME}</p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            {resetSuccess && (
              <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-5">
                <p className="text-brand-700 text-sm">
                  Mot de passe mis à jour. Connectez-vous avec votre nouveau mot de passe.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                  Adresse email
                </label>
                <input
                  type="email"
                  placeholder="vous@exemple.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-neutral-50 transition-all"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-600">
                    Mot de passe
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-neutral-50 transition-all"
                />
              </div>

              {error && (
                <div className="bg-error-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-error-700 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </div>
          </div>

          <p className="text-center text-neutral-500 text-sm mt-5">
            Pas encore de compte ?{" "}
            <Link
              href="/auth/register"
              className="text-brand-600 font-semibold hover:text-brand-700 transition-colors"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}