"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { SITE_NAME } from "@/lib/site";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue");
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Mot de passe oublié
          </h1>
          <p className="text-gray-500 mb-6">
            Saisissez l&apos;email de votre compte {SITE_NAME}. Nous vous
            enverrons un lien pour choisir un nouveau mot de passe.
          </p>

          <div className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500"
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && (
              <p className="text-brand-700 text-sm bg-brand-50 border border-brand-100 rounded-lg px-4 py-3">
                {success}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !email.trim()}
              className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Envoi..." : "Envoyer le lien"}
            </button>
          </div>

          <p className="text-center text-gray-500 mt-6">
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
