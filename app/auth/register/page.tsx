"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import PhoneField from "@/components/profile/PhoneField";
import TurnstileWidget from "@/components/security/TurnstileWidget";
import { isTurnstileClientEnabled } from "@/lib/turnstile-config";
import { cn } from "@/lib/utils";
import {
  accountTypeFromSearch,
  RegisterAccountTypePicker,
  RegisterIndividualFields,
  RegisterProIdentityFields,
  type AccountType,
} from "@/components/auth/RegisterAccountSections";

function RegisterPageContent() {
  const turnstileEnabled = isTurnstileClientEnabled();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accountType, setAccountType] = useState<AccountType>(() =>
    accountTypeFromSearch(searchParams.get("type"), searchParams.get("role"))
  );
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [providerAddress, setProviderAddress] = useState("");
  const [providerCity, setProviderCity] = useState("");
  const [nif, setNif] = useState("");
  const [stat, setStat] = useState("");
  const [rcs, setRcs] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const isPro = accountType === "CLIENT_PRO";
  const isProvider = accountType === "PROVIDER";

  const heading = useMemo(() => {
    if (isPro) return "Créer un compte entreprise";
    if (accountType === "PROVIDER") return "Devenir prestataire";
    return "Créer un compte";
  }, [accountType, isPro]);

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
          email,
          password,
          phone: phone.trim(),
          role: accountType === "PROVIDER" ? "PROVIDER" : "CLIENT",
          clientKind: isPro ? "PROFESSIONAL" : "INDIVIDUAL",
          name: isPro ? companyName.trim() : name.trim(),
          companyName: isPro ? companyName.trim() : undefined,
          companyAddress: isPro ? companyAddress.trim() : undefined,
          providerAddress: isProvider ? providerAddress.trim() : undefined,
          providerCity: isProvider ? providerCity : undefined,
          nif: isPro ? nif.trim() : undefined,
          stat: isPro ? stat.trim() : undefined,
          rcs: isPro ? rcs.trim() : undefined,
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
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className={cn("w-full", isPro ? "max-w-xl" : "max-w-md")}>
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="2" />
                <path d="M7 11h8M11 7v8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPro
                ? `Facturez et réservez au nom de votre société sur ${SITE_NAME}`
                : `Rejoignez ${SITE_NAME} gratuitement`}
            </p>
          </div>

          <RegisterAccountTypePicker
            value={accountType}
            onChange={setAccountType}
          />

          <Card>
            <CardHeader>
              <CardTitle className="sr-only">Inscription</CardTitle>
              <CardDescription className="sr-only">
                Créez votre compte {SITE_NAME}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {isPro ? (
                <RegisterProIdentityFields
                  companyName={companyName}
                  nif={nif}
                  stat={stat}
                  rcs={rcs}
                  companyAddress={companyAddress}
                  onCompanyNameChange={setCompanyName}
                  onNifChange={setNif}
                  onStatChange={setStat}
                  onRcsChange={setRcs}
                  onCompanyAddressChange={setCompanyAddress}
                />
              ) : (
                <RegisterIndividualFields
                  name={name}
                  isProvider={isProvider}
                  providerAddress={providerAddress}
                  providerCity={providerCity}
                  onNameChange={setName}
                  onProviderAddressChange={setProviderAddress}
                  onProviderCityChange={setProviderCity}
                />
              )}

              <PhoneField value={phone} onChange={setPhone} />

              {isPro ? (
                <p className="pt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Accès au compte
                </p>
              ) : null}

              <FormField label="Adresse email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormField>

              <FormField label="Mot de passe" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                {loading
                  ? "Création..."
                  : isPro
                    ? "Créer le compte entreprise"
                    : "Créer mon compte"}
              </Button>
            </CardContent>
          </Card>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Chargement...
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
