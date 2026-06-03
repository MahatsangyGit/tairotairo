"use client";

import { useState } from "react";

interface EmailVerificationProps {
  email: string;
  emailVerified: boolean;
  onVerified?: () => void;
}

export default function EmailVerification({
  email,
  emailVerified,
  onVerified,
}: EmailVerificationProps) {
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendOtp = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/email/send-otp", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Impossible d'envoyer le code");
        return;
      }

      setSent(true);
      setSuccess("Code envoyé à " + email);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Code invalide");
        return;
      }

      setSuccess("Email vérifié avec succès");
      onVerified?.();
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (emailVerified) {
    return (
      <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 text-sm text-brand-800">
        ✓ Email vérifié ({email})
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <h3 className="font-semibold text-gray-800 mb-1">Vérification par email</h3>
      <p className="text-sm text-gray-600 mb-4">
        Un code à 6 chiffres sera envoyé à <strong>{email}</strong>
      </p>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      {success && <p className="text-brand-600 text-sm mb-3">{success}</p>}

      {!sent ? (
        <button
          onClick={handleSendOtp}
          disabled={loading}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? "Envoi..." : "Recevoir le code par email"}
        </button>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-center tracking-widest font-mono"
          />
          <button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "..." : "Vérifier"}
          </button>
          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="text-sm text-amber-700 hover:underline px-2"
          >
            Renvoyer
          </button>
        </div>
      )}
    </div>
  );
}
