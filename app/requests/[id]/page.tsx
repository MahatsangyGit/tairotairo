"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatSchedule } from "@/lib/datetime-slot";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  RequestDetailMainColumn,
  RequestDetailSidebar,
  type RequestDetailAuthUser,
  type RequestResponseItem,
  type ServiceRequestDetail,
} from "@/components/requests/RequestDetailSections";

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<ServiceRequestDetail | null>(null);
  const [responses, setResponses] = useState<RequestResponseItem[]>([]);
  const [user, setUser] = useState<RequestDetailAuthUser | null>(null);
  const [canPropose, setCanPropose] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [withdrawTarget, setWithdrawTarget] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [reqRes, propRes, meRes] = await Promise.all([
        fetch(`/api/requests/${id}`),
        fetch(`/api/requests/${id}/responses`),
        fetch("/api/auth/me"),
      ]);

      const reqData = await reqRes.json();
      const propData = await propRes.json();
      const meData = await meRes.json();

      if (!reqRes.ok) {
        setError(reqData.error ?? "Demande introuvable");
        return;
      }

      setRequest(reqData.request);
      setResponses(propData.responses ?? []);
      setUser(meData.user ?? null);
      setIsOwner(propData.isOwner ?? false);
      setCanPropose(propData.canPropose ?? false);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitProposal = async () => {
    if (!message.trim()) {
      setActionError("Veuillez rédiger un message");
      return;
    }

    setSubmitting(true);
    setActionError("");

    try {
      const res = await fetch(`/api/requests/${id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          proposedPrice: proposedPrice || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/auth/login?callbackUrl=/requests/${id}`);
          return;
        }
        setActionError(data.error ?? "Erreur lors de l'envoi");
        return;
      }

      setMessage("");
      setProposedPrice("");
      setCanPropose(false);
      await fetchData();
    } catch {
      setActionError("Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const runWithdraw = async (responseId: string) => {
    setActionError("");

    try {
      const res = await fetch(`/api/requests/${id}/responses/${responseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WITHDRAWN" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error ?? "Impossible de retirer");
        return;
      }

      setWithdrawTarget(null);
      await fetchData();
    } catch {
      setActionError("Une erreur est survenue");
    }
  };

  const desiredDateLabel =
    request?.desiredDate &&
    formatSchedule(
      request.desiredDate,
      request.desiredSlotStart,
      request.desiredSlotEnd
    );

  const ownResponse =
    user?.role === "PROVIDER"
      ? responses.find((r) => r.provider.id === user.id)
      : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link
          href="/requests"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-amber-600 mb-6"
        >
          ← Retour aux demandes
        </Link>

        {loading && (
          <div className="bg-card rounded-2xl border border-border p-8 animate-pulse h-64" />
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <Link href="/requests" className="text-amber-600 font-medium hover:underline">
              Retour aux demandes
            </Link>
          </div>
        )}

        {!loading && !error && request && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RequestDetailMainColumn
              id={id}
              request={request}
              desiredDateLabel={desiredDateLabel}
              isOwner={isOwner}
              responses={responses}
            />
            <RequestDetailSidebar
              id={id}
              request={request}
              user={user}
              canPropose={canPropose}
              ownResponse={ownResponse}
              actionError={actionError}
              message={message}
              proposedPrice={proposedPrice}
              submitting={submitting}
              onMessageChange={setMessage}
              onProposedPriceChange={setProposedPrice}
              onSubmitProposal={handleSubmitProposal}
              onRequestWithdraw={setWithdrawTarget}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={withdrawTarget != null}
        onOpenChange={(open) => {
          if (!open) setWithdrawTarget(null);
        }}
        title="Retirer la proposition"
        description="Retirer votre proposition ?"
        confirmLabel="Retirer"
        destructive
        onConfirm={() => {
          if (withdrawTarget) runWithdraw(withdrawTarget);
        }}
      />
    </div>
  );
}
