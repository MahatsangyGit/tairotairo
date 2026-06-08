"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { SITE_NAME } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { StatusAlert } from "@/components/ui/status-alert";

function safeCallbackUrl(url: string | null): string | null {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return null;
  return url;
}

interface FormData {
  email: string;
  password: string;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "PROVIDER" | "ADMIN";
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const resetSuccess = searchParams.get("reset") === "success";
  const suspended = searchParams.get("suspended") === "1";

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
    <div className="min-h-screen bg-background flex flex-col">
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
            <h1 className="text-2xl font-bold text-foreground">Connexion</h1>
            <p className="text-muted-foreground text-sm mt-1">Bienvenue sur {SITE_NAME}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="sr-only">Connexion</CardTitle>
              <CardDescription className="sr-only">
                Connectez-vous à votre compte {SITE_NAME}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {suspended && (
                <StatusAlert variant="error">
                  Ce compte a été suspendu. Contactez le support pour plus d&apos;informations.
                </StatusAlert>
              )}

              {resetSuccess && (
                <StatusAlert variant="success">
                  Mot de passe mis à jour. Connectez-vous avec votre nouveau mot de passe.
                </StatusAlert>
              )}

              <FormField label="Adresse email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </FormField>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Mot de passe
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>

              {error && <StatusAlert variant="error">{error}</StatusAlert>}

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-muted-foreground text-sm mt-5">
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
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
