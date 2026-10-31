"use client";

import Link from "next/link";
import OpenUserChatButton from "@/components/messages/OpenUserChatButton";
import {
  RESPONSE_STATUS_CLASS,
  RESPONSE_STATUS_LABEL,
  type RequestResponseStatus,
} from "@/lib/request-response-status";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { MapPinIcon } from "@/components/ui/app-icons";
import ServiceCommissionHint from "@/components/economy/ServiceCommissionHint";

export interface RequestDetailClient {
  id: string;
  name: string;
  avatar: string | null;
  phone: string | null;
}

export interface RequestDetailProvider {
  id: string;
  name: string;
  avatar: string | null;
  phone: string | null;
}

export interface RequestResponseItem {
  id: string;
  message: string;
  proposedPrice: number | null;
  status: RequestResponseStatus;
  createdAt: string;
  provider: RequestDetailProvider;
}

export interface ServiceRequestDetail {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  location: string;
  coverImageUrl: string | null;
  desiredDate: string | null;
  desiredSlotStart: string | null;
  desiredSlotEnd: string | null;
  open: boolean;
  createdAt: string;
  client: RequestDetailClient;
}

export interface RequestDetailAuthUser {
  id: string;
  role: "CLIENT" | "PROVIDER" | "ADMIN";
}

export function RequestDetailMainColumn({
  id,
  request,
  desiredDateLabel,
  isOwner,
  responses,
}: {
  id: string;
  request: ServiceRequestDetail;
  desiredDateLabel: string | null | undefined;
  isOwner: boolean;
  responses: RequestResponseItem[];
}) {
  return (
    <div className="lg:col-span-2 flex flex-col gap-6">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {request.coverImageUrl && (
          <div className="relative w-full h-80 max-h-80 bg-muted">
            <OptimizedImage
              src={request.coverImageUrl}
              alt={request.title}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              priority
            />
          </div>
        )}
        <div className="p-8">
          <span className="inline-block bg-amber-50 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full mb-4">
            {request.category}
          </span>
          <h1 className="text-2xl font-bold text-foreground mb-3">{request.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span>
              <MapPinIcon /> {request.location}
            </span>
            {desiredDateLabel && <span>📅 Souhaité : {desiredDateLabel}</span>}
            <span
              className={`font-medium ${request.open ? "text-brand-600" : "text-muted-foreground"}`}
            >
              {request.open ? "● Ouverte" : "● Fermée"}
            </span>
          </div>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {request.description}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h2 className="font-semibold text-foreground mb-4">Client</h2>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg shrink-0">
            {request.client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-foreground">{request.client.name}</p>
            {request.client.phone && (
              <a
                href={`tel:${request.client.phone}`}
                className="text-amber-700 text-sm mt-1 block hover:underline"
              >
                📞 {request.client.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Propositions reçues ({responses.length})
            </h2>
            <Link
              href={`/dashboard/client/requests/${id}`}
              className="text-sm text-amber-600 font-medium hover:underline"
            >
              Gérer →
            </Link>
          </div>
          {responses.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune proposition pour l&apos;instant
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {responses.slice(0, 3).map((r) => (
                <div key={r.id} className="border border-border rounded-xl p-4">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <p className="font-medium text-foreground text-sm">
                      {r.provider.name}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${RESPONSE_STATUS_CLASS[r.status]}`}
                    >
                      {RESPONSE_STATUS_LABEL[r.status]}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {r.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RequestDetailSidebar({
  id,
  request,
  user,
  canPropose,
  ownResponse,
  actionError,
  message,
  proposedPrice,
  submitting,
  onMessageChange,
  onProposedPriceChange,
  onSubmitProposal,
  onRequestWithdraw,
}: {
  id: string;
  request: ServiceRequestDetail;
  user: RequestDetailAuthUser | null;
  canPropose: boolean;
  ownResponse: RequestResponseItem | null | undefined;
  actionError: string;
  message: string;
  proposedPrice: string;
  submitting: boolean;
  onMessageChange: (value: string) => void;
  onProposedPriceChange: (value: string) => void;
  onSubmitProposal: () => void;
  onRequestWithdraw: (responseId: string) => void;
}) {
  return (
    <div className="lg:col-span-1 flex flex-col gap-4">
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sticky top-6">
        <p className="text-sm text-muted-foreground mb-1">Budget proposé</p>
        <p className="text-3xl font-bold text-amber-700 mb-6">
          {request.budget.toLocaleString("fr-MG")} Ar
        </p>

        {actionError && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 rounded-lg px-3 py-2">
            {actionError}
          </p>
        )}

        {!user && request.open && (
          <Link
            href={`/auth/login?callbackUrl=/requests/${id}`}
            className="block w-full text-center bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors mb-3"
          >
            Se connecter pour proposer
          </Link>
        )}

        {canPropose && (
          <div className="mb-4">
            <h3 className="font-semibold text-foreground mb-3 text-sm">
              Envoyer une proposition
            </h3>
            <textarea
              placeholder="Présentez-vous et expliquez comment vous pouvez aider..."
              rows={4}
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-brand-500 resize-none mb-3"
            />
            <input
              type="number"
              min="0"
              placeholder="Votre prix (Ar) — optionnel"
              value={proposedPrice}
              onChange={(e) => onProposedPriceChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-brand-500 mb-3"
            />
            <ServiceCommissionHint
              className="mb-3"
              category={request.category}
              price={Number(proposedPrice)}
            />
            <button
              onClick={onSubmitProposal}
              disabled={submitting}
              className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Envoi..." : "Envoyer ma proposition"}
            </button>
          </div>
        )}

        {ownResponse && (
          <div className="border border-border rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-foreground">Votre proposition</p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${RESPONSE_STATUS_CLASS[ownResponse.status]}`}
              >
                {RESPONSE_STATUS_LABEL[ownResponse.status]}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mb-3">{ownResponse.message}</p>
            {ownResponse.proposedPrice !== null && (
              <ServiceCommissionHint
                className="mb-3"
                category={request.category}
                price={ownResponse.proposedPrice}
              />
            )}
            <div className="mb-3">
              <OpenUserChatButton
                clientId={request.client.id}
                requestResponseId={ownResponse.id}
                label="Négocier le prix par message"
                className="text-sm text-brand-600 font-medium border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50 disabled:opacity-50"
              />
            </div>
            {ownResponse.status === "PENDING" && (
              <button
                onClick={() => onRequestWithdraw(ownResponse.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Retirer ma proposition
              </button>
            )}
            <Link
              href="/dashboard/provider/proposals"
              className="block text-sm text-brand-600 font-medium hover:underline mt-2"
            >
              Voir toutes mes propositions →
            </Link>
          </div>
        )}

        {user?.role === "PROVIDER" && !canPropose && !ownResponse && !request.open && (
          <p className="text-muted-foreground text-sm text-center mb-3">
            Cette demande n&apos;accepte plus de propositions
          </p>
        )}

        {request.open && request.client.phone && user?.role !== "PROVIDER" && (
          <a
            href={`tel:${request.client.phone}`}
            className="block w-full text-center bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors mb-3"
          >
            Contacter le client
          </a>
        )}
      </div>
    </div>
  );
}
