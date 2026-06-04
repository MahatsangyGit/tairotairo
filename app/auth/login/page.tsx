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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Connexion
          </h1>
          <p className="text-gray-500 mb-6">
            Bienvenue sur {SITE_NAME}
          </p>

          {resetSuccess && (
            <p className="text-brand-700 text-sm bg-brand-50 border border-brand-100 rounded-lg px-4 py-3 mb-4">
              Votre mot de passe a été mis à jour. Connectez-vous avec votre
              nouveau mot de passe.
            </p>
          )}

          <div className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500"
            />
            <div>
              <input
                type="password"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500"
              />
              <p className="text-right mt-2">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-brand-600 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </div>

          <p className="text-center text-gray-500 mt-6">
            Pas encore de compte ?{" "}
            <Link
              href="/auth/register"
              className="text-brand-600 font-medium hover:underline"
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">Chargement...</p>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}