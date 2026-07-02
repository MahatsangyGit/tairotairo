"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ProviderNav from "@/components/layout/ProviderNav";
import ProviderKycBanner from "@/components/kyc/ProviderKycBanner";
import OpenUserChatButton from "@/components/messages/OpenUserChatButton";
import {
  RESPONSE_STATUS_CLASS,
  RESPONSE_STATUS_LABEL,
  effectiveResponseStatus,
  RequestResponseStatus,
} from "@/lib/request-response-status";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MapPinIcon } from "@/components/ui/app-icons";

interface RequestSummary {
  id: string;
  title: string;
  category: string;
  location: string;
  budget: number;
  open: boolean;
  client: { id: string; name: string };
}

interface ProviderResponse {
  id: string;
  message: string;
  proposedPrice: number | null;
  status: RequestResponseStatus;
  createdAt: string;
  booking: { id: string; status: string } | null;
  request: RequestSummary;
}

export default function ProviderProposalsPage() {
  const router = useRouter();

  const [responses, setResponses] = useState<ProviderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<{
    requestId: string;
    responseId: string;
  } | null>(null);

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/responses");
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login?callbackUrl=/dashboard/provider/proposals");
          return;
        }
        if (res.status === 403) {
          router.push("/dashboard/client");
          return;
        }
        setError(data.error ?? "Erreur lors du chargement");
        return;
      }

      setResponses(data.responses);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const runWithdraw = async (requestId: string, responseId: string) => {
    setWithdrawingId(responseId);
    setActionError("");

    try {
      const res = await fetch(
        `/api/requests/${requestId}/responses/${responseId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "WITHDRAWN" }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error ?? "Impossible de retirer");
        return;
      }

      setResponses((prev) =>
        prev.map((r) =>
          r.id === responseId ? { ...r, status: "WITHDRAWN" as const } : r
        )
      );
      setWithdrawTarget(null);
    } catch {
      setActionError("Une erreur est survenue");
    } finally {
      setWithdrawingId(null);
    }
  };

  const counts = responses.reduce<Record<string, number>>((acc, r) => {
    const key =
      r.booking?.status === "COMPLETED" ? "COMPLETED" : r.status;
    return { ...acc, [key]: (acc[key] ?? 0) + 1 };
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground mb-1">Espace prestataire</h1>
          <p className="text-muted-foreground text-sm">Suivez vos propositions envoyées aux clients</p>
        </div>

        <ProviderNav />
        <ProviderKycBanner />

        {actionError && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {actionError}
          </p>
        )}

        {!loading && !error && responses.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {(
              ["PENDING", "ACCEPTED", "COMPLETED", "REJECTED", "WITHDRAWN"] as RequestResponseStatus[]
            ).map(
              (s) => (
                <div
                  key={s}
                  className="bg-card rounded-xl border border-border p-4 text-center"
                >
                  <p className="text-2xl font-bold text-foreground">{counts[s] ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{RESPONSE_STATUS_LABEL[s]}</p>
                </div>
              )
            )}
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border p-6 animate-pulse h-32"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchResponses}
              className="text-brand-600 font-medium hover:underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && responses.length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <p className="text-muted-foreground mb-2">Aucune proposition envoyée</p>
            <p className="text-muted-foreground text-sm mb-4">
              Parcourez les demandes clients et proposez vos services
            </p>
            <Link
              href="/requests"
              className="bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-700 inline-block"
            >
              Voir les demandes
            </Link>
          </div>
        )}

        {!loading && !error && responses.length > 0 && (
          <div className="flex flex-col gap-4">
            {responses.map((response) => {
              const displayStatus = effectiveResponseStatus(response);
              return (
              <div
                key={response.id}
                className="bg-card rounded-2xl border border-border shadow-sm p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="inline-block bg-amber-50 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full mb-2">
                      {response.request.category}
                    </span>
                    <h3 className="font-semibold text-foreground">
                      {response.request.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      <MapPinIcon /> {response.request.location} · Budget client{" "}
                      {response.request.budget.toLocaleString("fr-MG")} Ar
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${RESPONSE_STATUS_CLASS[displayStatus]}`}
                  >
                    {RESPONSE_STATUS_LABEL[displayStatus]}
                  </span>
                </div>

                <p className="text-muted-foreground text-sm mb-3 whitespace-pre-line">
                  {response.message}
                </p>

                {response.proposedPrice !== null && (
                  <p className="text-brand-600 font-semibold text-sm mb-4">
                    Votre prix : {response.proposedPrice.toLocaleString("fr-MG")} Ar
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
                  <OpenUserChatButton
                    clientId={response.request.client.id}
                    requestResponseId={response.id}
                    label={`Message à ${response.request.client.name}`}
                  />
                  <Link
                    href={`/requests/${response.request.id}`}
                    className="text-sm text-brand-600 font-medium hover:underline"
                  >
                    Voir la demande →
                  </Link>
                  {response.status === "PENDING" && (
                    <button
                      onClick={() =>
                        setWithdrawTarget({
                          requestId: response.request.id,
                          responseId: response.id,
                        })
                      }
                      disabled={withdrawingId === response.id}
                      className="text-sm text-red-600 font-medium border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 ml-auto"
                    >
                      {withdrawingId === response.id ? "..." : "Retirer"}
                    </button>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={withdrawTarget != null}
        onOpenChange={(open) => {
          if (!open) setWithdrawTarget(null);
        }}
        title="Retirer la proposition"
        description="Retirer cette proposition ?"
        confirmLabel="Retirer"
        destructive
        loading={withdrawingId != null}
        onConfirm={() => {
          if (withdrawTarget) {
            runWithdraw(withdrawTarget.requestId, withdrawTarget.responseId);
          }
        }}
      />
    </div>
  );
}
