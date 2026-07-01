"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TurnstileWidget from "@/components/security/TurnstileWidget";
import { isTurnstileClientEnabled } from "@/lib/turnstile-config";

type Role = "CLIENT" | "PROVIDER";

interface FormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
}

export default function RegisterPage() {
  const turnstileEnabled = isTurnstileClientEnabled();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "CLIENT",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const handleSubmit = async () => {
    setError("");
    if (turnstileEnabled && !turnstileToken) {
      setError("Validez la vérification anti-bot avant de continuer.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ...(turnstileEnabled ? { turnstileToken } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setTurnstileToken(null);
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      router.push("/auth/login?registered=true");
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
            <h1 className="text-2xl font-bold text-foreground">Créer un compte</h1>
            <p className="text-muted-foreground text-sm mt-1">Rejoignez {SITE_NAME} gratuitement</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="sr-only">Inscription</CardTitle>
              <CardDescription className="sr-only">
                Créez votre compte {SITE_NAME}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Tabs
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as Role })
                }
              >
                <TabsList className="w-full">
                  <TabsTrigger value="CLIENT" className="flex-1">
                    Je cherche
                  </TabsTrigger>
                  <TabsTrigger value="PROVIDER" className="flex-1">
                    Je propose
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="CLIENT" className="sr-only" />
                <TabsContent value="PROVIDER" className="sr-only" />
              </Tabs>

              <FormField label="Nom complet" htmlFor="name">
                <Input
                  id="name"
                  type="text"
                  placeholder="Jean Dupont"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </FormField>

              <FormField label="Adresse email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </FormField>

              <FormField label="Mot de passe" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </FormField>

              <FormField label="Téléphone" htmlFor="phone">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="034 00 000 00"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </FormField>

              {error && <StatusAlert variant="error">{error}</StatusAlert>}

              {turnstileEnabled ? (
                <TurnstileWidget
                  action="register"
                  onTokenChange={setTurnstileToken}
                  resetKey={turnstileResetKey}
                />
              ) : null}

              <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {loading ? "Création..." : "Créer mon compte"}
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-muted-foreground text-sm mt-5">
            Déjà un compte ?{" "}
            <Link
              href="/auth/login"
              className="text-brand-600 font-semibold hover:text-brand-700 transition-colors"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
