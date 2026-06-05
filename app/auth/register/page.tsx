"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { SITE_NAME } from "@/lib/site";

type Role = "CLIENT" | "PROVIDER";

interface FormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
}

export default function RegisterPage() {
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

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
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
            <h1 className="text-2xl font-bold text-neutral-900">Créer un compte</h1>
            <p className="text-neutral-500 text-sm mt-1">Rejoignez {SITE_NAME} gratuitement</p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            {/* Role toggle */}
            <div className="flex gap-2 mb-5 p-1 bg-neutral-100 rounded-xl">
              {(["CLIENT", "PROVIDER"] as Role[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setFormData({ ...formData, role })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.role === role
                      ? "bg-white text-brand-700 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {role === "CLIENT" ? "Je cherche" : "Je propose"}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Nom complet</label>
                <input
                  type="text"
                  placeholder="Jean Dupont"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-neutral-50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Adresse email</label>
                <input
                  type="email"
                  placeholder="vous@exemple.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-neutral-50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-neutral-50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  placeholder="034 00 000 00"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                {loading ? "Création..." : "Créer mon compte"}
              </button>
            </div>
          </div>

          <p className="text-center text-neutral-500 text-sm mt-5">
            Déjà un compte ?{" "}
            <Link href="/auth/login" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}