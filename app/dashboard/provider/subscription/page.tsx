"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ProviderNav from "@/components/layout/ProviderNav";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PERIOD_DAYS } from "@/lib/subscription";
import type { SubscriptionPlanId } from "@/lib/subscription-plans";

type SubscriptionState = {
  expiresAt: string;
  isActive: boolean;
  startsAt: string;
} | null;

interface Plan {
  id: SubscriptionPlanId;
  months: number;
  label: string;
  description: string;
  priceMGA: number;
  savingsLabel?: string;
}

interface PaymentRow {
  id: string;
  months: number;
  amount: number;
  paymentMethod: string;
  phone: string;
  status: string;
  referenceId: string;
  createdAt: string;
}

const METHOD_LABELS: Record<string, string> = {
  ORANGE_MONEY: "Orange Money",
  MVOLA: "MVola",
  AIRTEL_MONEY: "Airtel Money",
};

export default function ProviderSubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [subscription, setSubscription] = useState<SubscriptionState>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [canFeature, setCanFeature] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>("1-month");
  const [paymentMethod, setPaymentMethod] = useState("ORANGE_MONEY");
  const [phone, setPhone] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/provider/subscription");
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login?callbackUrl=/dashboard/provider/subscription");
          return;
        }
        if (res.status === 403) {
          router.push("/dashboard/client");
          return;
        }
        setError(data.error ?? "Erreur de chargement");
        return;
      }

      setSubscription(data.subscription ?? null);
      setPlans(data.plans ?? []);
      setBenefits(data.benefits ?? []);
      setPayments(data.payments ?? []);
      setCanFeature(Boolean(data.spotlight?.canFeature));
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.phone) setPhone(data.user.phone.replace(/\D/g, ""));
      })
      .catch(() => {});
  }, [load]);

  const selected = plans.find((p) => p.id === selectedPlan) ?? plans[0];

  const handlePurchase = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/provider/subscription/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          months: selected.months,
          paymentMethod,
          phone,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Paiement impossible");
        return;
      }

      if (data.pending) {
        setSuccess(
          `${data.message} Référence : ${data.payment.referenceId}`
        );
      } else {
        setSuccess(data.message);
      }
      await load();
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-neutral-900">Abonnement prestataire</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Boostez votre visibilité sur {SUBSCRIPTION_PERIOD_DAYS} jours par période
          </p>
        </div>

        <ProviderNav />

        {loading && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 animate-pulse h-48" />
        )}

        {!loading && subscription?.isActive && (
          <div className="mb-6 bg-brand-50 border border-brand-100 rounded-xl px-4 py-4 text-sm text-brand-900">
            <p className="font-semibold">Abonnement actif</p>
            <p className="mt-1 text-brand-800">
              Valide jusqu&apos;au{" "}
              {new Date(subscription.expiresAt).toLocaleDateString("fr-MG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              .
              {canFeature ? (
                <>
                  {" "}
                  <Link href="/dashboard/provider/services" className="underline font-medium">
                    Choisissez une annonce
                  </Link>{" "}
                  à mettre en avant.
                </>
              ) : (
                " Complétez votre KYC pour activer la mise en avant sur l'accueil."
              )}
            </p>
          </div>
        )}

        {!loading && (
          <div className="grid gap-6">
            <section className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="font-semibold text-neutral-900 mb-4">Ce que vous obtenez</h2>
              <ul className="space-y-2">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-neutral-700">
                    <span className="text-brand-600 mt-0.5">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="font-semibold text-neutral-900 mb-4">Choisir une formule</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`text-left rounded-xl border p-4 transition-colors ${
                      selectedPlan === plan.id
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                        : "border-neutral-200 hover:border-brand-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-neutral-900">{plan.label}</span>
                      {plan.savingsLabel && (
                        <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          {plan.savingsLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{plan.description}</p>
                    <p className="text-lg font-bold text-brand-700 mt-3">
                      {plan.priceMGA.toLocaleString("fr-MG")} Ar
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="font-semibold text-neutral-900 mb-4">Paiement Mobile Money</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Opérateur
                  </label>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {[
                      { id: "ORANGE_MONEY", label: "Orange Money" },
                      { id: "MVOLA", label: "MVola" },
                      { id: "AIRTEL_MONEY", label: "Airtel Money" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                          paymentMethod === m.id
                            ? "border-brand-500 bg-brand-50 text-brand-800"
                            : "border-neutral-200 text-neutral-600 hover:border-brand-300"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
                    Numéro Mobile Money
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="034 12 345 67"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-brand-500"
                  />
                  <p className="text-xs text-neutral-400 mt-1">
                    Vous recevrez une demande de confirmation sur ce numéro.
                  </p>
                </div>

                {selected && (
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <span className="text-sm text-neutral-600">Total à payer</span>
                    <span className="text-xl font-bold text-neutral-900">
                      {selected.priceMGA.toLocaleString("fr-MG")} Ar
                    </span>
                  </div>
                )}

                <Button
                  onClick={handlePurchase}
                  disabled={submitting || !phone.trim() || !selected}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  {submitting
                    ? "Traitement…"
                    : subscription?.isActive
                      ? "Prolonger mon abonnement"
                      : "Payer et activer"}
                </Button>
              </div>
            </section>

            {payments.length > 0 && (
              <section className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="font-semibold text-neutral-900 mb-4">Historique des paiements</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-neutral-500 border-b border-neutral-100">
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Montant</th>
                        <th className="pb-2 font-medium">Méthode</th>
                        <th className="pb-2 font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2.5 text-neutral-700">
                            {new Date(p.createdAt).toLocaleDateString("fr-MG")}
                          </td>
                          <td className="py-2.5 font-medium">
                            {p.amount.toLocaleString("fr-MG")} Ar
                          </td>
                          <td className="py-2.5 text-neutral-600">
                            {METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                p.status === "SUCCESS"
                                  ? "bg-brand-50 text-brand-700"
                                  : p.status === "PENDING"
                                    ? "bg-amber-50 text-amber-800"
                                    : "bg-red-50 text-red-700"
                              }`}
                            >
                              {p.status === "SUCCESS"
                                ? "Réussi"
                                : p.status === "PENDING"
                                  ? "En attente"
                                  : "Échoué"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}

        {error && (
          <p className="mt-4 text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 text-brand-700 text-sm bg-brand-50 border border-brand-100 rounded-lg px-4 py-3">
            {success}
          </p>
        )}
      </div>
    </div>
  );
}
