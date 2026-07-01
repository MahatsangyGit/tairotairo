"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { SITE_NAME } from "@/lib/site";
import TurnstileWidget from "@/components/security/TurnstileWidget";
import { isTurnstileClientEnabled } from "@/lib/turnstile-config";

export default function ForgotPasswordPage() {
  const turnstileEnabled = isTurnstileClientEnabled();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (turnstileEnabled && !turnstileToken) {
      setError("Validez la vérification anti-bot avant de continuer.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...(turnstileEnabled ? { turnstileToken } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue");
        setTurnstileToken(null);
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      setSuccess(data.message);
      setEmail("");
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-card rounded-2xl shadow-sm p-8 border border-border">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Mot de passe oublié
          </h1>
          <p className="text-muted-foreground mb-6">
            Saisissez l&apos;email de votre compte {SITE_NAME}. Nous vous
            enverrons un lien pour choisir un nouveau mot de passe.
          </p>

          <div className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-brand-500"
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && (
              <p className="text-brand-700 text-sm bg-brand-50 border border-brand-100 rounded-lg px-4 py-3">
                {success}
              </p>
            )}

            {turnstileEnabled ? (
              <TurnstileWidget
                action="forgot_password"
                onTokenChange={setTurnstileToken}
                resetKey={turnstileResetKey}
              />
            ) : null}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                loading ||
                !email.trim() ||
                (turnstileEnabled && !turnstileToken)
              }
              className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Envoi..." : "Envoyer le lien"}
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
