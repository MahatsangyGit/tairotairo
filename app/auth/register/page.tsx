"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconBriefcase,
  IconBuilding,
  IconUser,
} from "@tabler/icons-react";
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
import { Textarea } from "@/components/ui/textarea";
import PhoneField from "@/components/profile/PhoneField";
import TurnstileWidget from "@/components/security/TurnstileWidget";
import { isTurnstileClientEnabled } from "@/lib/turnstile-config";
import { cn } from "@/lib/utils";

type AccountType = "CLIENT" | "CLIENT_PRO" | "PROVIDER";

const ACCOUNT_TYPES: {
  id: AccountType;
  title: string;
  description: string;
  icon: typeof IconUser;
}[] = [
  {
    id: "CLIENT",
    title: "Particulier",
    description: "Je cherche un prestataire",
    icon: IconUser,
  },
  {
    id: "CLIENT_PRO",
    title: "Entreprise",
    description: "Client professionnel",
    icon: IconBuilding,
  },
  {
    id: "PROVIDER",
    title: "Prestataire",
    description: "Je propose mes services",
    icon: IconBriefcase,
  },
];

function accountTypeFromSearch(type: string | null, role: string | null): AccountType {
  if (type === "pro" || type === "entreprise" || role === "CLIENT_PRO") {
    return "CLIENT_PRO";
  }
  if (role === "PROVIDER") return "PROVIDER";
  return "CLIENT";
}

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

          <div className="mb-5 grid grid-cols-3 gap-2">
            {ACCOUNT_TYPES.map((option) => {
              const selected = accountType === option.id;
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setAccountType(option.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition-colors",
                    selected
                      ? "border-brand-600 bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-200"
                      : "border-border bg-card text-muted-foreground hover:border-brand-200 hover:text-foreground"
                  )}
                >
                  <Icon size={20} stroke={1.7} aria-hidden />
                  <span className="text-xs font-semibold leading-tight">
                    {option.title}
                  </span>
                  <span className="hidden text-[10px] leading-tight sm:block">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="sr-only">Inscription</CardTitle>
              <CardDescription className="sr-only">
                Créez votre compte {SITE_NAME}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {isPro ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Identité de la société
                  </p>
                  <FormField label="Nom de la société" htmlFor="companyName">
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="ex. Société Andry SARL"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="NIF"
                      htmlFor="nif"
                      hint="10 chiffres"
                    >
                      <Input
                        id="nif"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="3002064702"
                        value={nif}
                        onChange={(e) => setNif(e.target.value)}
                      />
                    </FormField>
                    <FormField
                      label="STAT"
                      htmlFor="stat"
                      hint="17 chiffres"
                    >
                      <Input
                        id="stat"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="41002 52 2015 0 00152"
                        value={stat}
                        onChange={(e) => setStat(e.target.value)}
                      />
                    </FormField>
                  </div>
                  <FormField
                    label="RCS"
                    htmlFor="rcs"
                    hint="Immatriculation au greffe"
                  >
                    <Input
                      id="rcs"
                      type="text"
                      autoComplete="off"
                      placeholder="RCS Antananarivo A 2024 00031"
                      value={rcs}
                      onChange={(e) => setRcs(e.target.value)}
                    />
                  </FormField>
                  <FormField label="Adresse sociale" htmlFor="companyAddress">
                    <Textarea
                      id="companyAddress"
                      rows={3}
                      placeholder="Lot, rue, commune — Antananarivo"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                    />
                  </FormField>
                </>
              ) : (
                <>
                  <FormField label="Nom complet" htmlFor="name">
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jean Dupont"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </FormField>
                </>
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
