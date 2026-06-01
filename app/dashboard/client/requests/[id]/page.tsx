"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import ClientNav from "@/components/layout/ClientNav";
import {
  RESPONSE_STATUS_CLASS,
  RESPONSE_STATUS_LABEL,
  RequestResponseStatus,
} from "@/lib/request-response-status";

interface Provider {
  id: string;
  name: string;
  avatar: string | null;
  phone: string | null;
  bio: string | null;
}

interface RequestResponse {
  id: string;
  message: string;
  proposedPrice: number | null;
  status: RequestResponseStatus;
  createdAt: string;
  provider: Provider;
}

interface ServiceRequest {
  id: string;
  title: string;
  category: string;
  location: string;
  budget: number;
  open: boolean;
}

export default function ClientRequestProposalsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [responses, setResponses] = useState<RequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [reqRes, propRes] = await Promise.all([
        fetch(`/api/requests/${id}`),
        fetch(`/api/requests/${id}/responses`),
      ]);

      const reqData = await reqRes.json();
      const propData = await propRes.json();

      if (!reqRes.ok) {
        setError(reqData.error ?? "Demande introuvable");
        return;
      }

      if (propRes.status === 401) {
        router.push(`/auth/login?callbackUrl=/dashboard/client/requests/${id}`);
        return;
      }

      if (!propRes.ok) {
        setError(propData.error ?? "Erreur lors du chargement");
        return;
      }

      if (!propData.isOwner) {
        router.push("/dashboard/client/requests");
        return;
      }

      setRequest(reqData.request);
      setResponses(propData.responses);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (
    responseId: string,
    status: RequestResponseStatus
  ) => {
    const confirmMsg =
      status === "ACCEPTED"
        ? "Accepter cette proposition ? La demande sera fermée et les autres propositions refusées."
        : "Refuser cette proposition ?";

    if (!confirm(confirmMsg)) return;

    setUpdatingId(responseId);
    setActionError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/requests/${id}/responses/${responseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error ?? "Impossible de mettre à jour");
        return;
      }

      if (status === "ACCEPTED" && data.booking) {
        setSuccessMessage(
          "Proposition acceptée — une réservation a été créée automatiquement."
        );
      }

      await fetchData();
    } catch {
      setActionError("Une erreur est survenue");
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = responses.filter((r) => r.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Espace client</h1>
          <p className="text-gray-500 text-sm">Propositions reçues pour votre demande</p>
        </div>

        <ClientNav />

        <Link
          href="/dashboard/client/requests"
          className="inline-flex text-sm text-gray-500 hover:text-amber-600 mb-6"
        >
          ← Retour à mes demandes
        </Link>

        {actionError && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {actionError}
          </p>
        )}

        {successMessage && (
          <div className="text-emerald-700 text-sm mb-4 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
            <span>{successMessage}</span>
            <Link
              href="/dashboard/client"
              className="font-medium underline shrink-0"
            >
              Voir mes réservations →
            </Link>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse h-40" />
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="text-emerald-600 font-medium hover:underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && request && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <span className="inline-block bg-amber-50 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full mb-2">
                {request.category}
              </span>
              <h2 className="font-semibold text-gray-800 text-lg">{request.title}</h2>
              <p className="text-gray-500 text-sm mt-1">
                📍 {request.location} · Budget {request.budget.toLocaleString("fr-MG")} Ar
              </p>
              <p className="text-sm mt-2">
                {responses.length} proposition{responses.length !== 1 ? "s" : ""}
                {pendingCount > 0 && (
                  <span className="text-amber-700 ml-2">
                    ({pendingCount} en attente)
                  </span>
                )}
              </p>
            </div>

            {responses.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-500 mb-2">Aucune proposition pour l&apos;instant</p>
                <p className="text-gray-400 text-sm">
                  Les prestataires intéressés pourront répondre depuis la fiche publique
                </p>
                <Link
                  href={`/requests/${id}`}
                  className="text-amber-600 text-sm font-medium hover:underline mt-4 inline-block"
                >
                  Voir la fiche publique →
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {responses.map((response) => (
                <div
                  key={response.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                        {response.provider.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {response.provider.name}
                        </p>
                        {response.provider.phone && (
                          <a
                            href={`tel:${response.provider.phone}`}
                            className="text-emerald-600 text-sm hover:underline"
                          >
                            📞 {response.provider.phone}
                          </a>
                        )}
                        {response.provider.bio && (
                          <p className="text-gray-500 text-sm mt-1">{response.provider.bio}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${RESPONSE_STATUS_CLASS[response.status]}`}
                    >
                      {RESPONSE_STATUS_LABEL[response.status]}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 whitespace-pre-line">
                    {response.message}
                  </p>

                  {response.proposedPrice !== null && (
                    <p className="text-emerald-600 font-semibold text-sm mb-4">
                      Prix proposé : {response.proposedPrice.toLocaleString("fr-MG")} Ar
                    </p>
                  )}

                  {response.status === "PENDING" && request.open && (
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleStatusChange(response.id, "ACCEPTED")}
                        disabled={updatingId === response.id}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {updatingId === response.id ? "..." : "Accepter"}
                      </button>
                      <button
                        onClick={() => handleStatusChange(response.id, "REJECTED")}
                        disabled={updatingId === response.id}
                        className="border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                      >
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
