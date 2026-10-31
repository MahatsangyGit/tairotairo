"use client";

import type { RefObject } from "react";
import Link from "next/link";
import UserAvatar from "@/components/profile/UserAvatar";
import ServiceCommissionHint from "@/components/economy/ServiceCommissionHint";
import type { SerializedMessage } from "@/lib/message-serialize";
import type { NegotiationContext } from "@/lib/price-negotiation-types";

export interface ConversationMeta {
  id: string;
  bookingId: string | null;
  subject: string;
  isDirect?: boolean;
  bookingStatus: string | null;
  negotiation: NegotiationContext | null;
  counterparty: { id: string; name: string; avatar: string | null };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("fr-MG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageThreadHeader({
  backHref,
  conversation,
}: {
  backHref: string;
  conversation: ConversationMeta;
}) {
  const negotiation = conversation.negotiation;

  return (
    <div className="mb-4">
      <Link
        href={backHref}
        className="text-sm text-brand-600 hover:underline mb-3 inline-block"
      >
        ← Retour aux messages
      </Link>
      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex items-start gap-3">
        <UserAvatar
          name={conversation.counterparty.name}
          avatar={conversation.counterparty.avatar}
          userId={conversation.counterparty.id}
          size="md"
        />
        <div className="min-w-0">
          <p className="font-semibold text-foreground">
            {conversation.counterparty.name}
          </p>
          <p className="text-sm text-muted-foreground">{conversation.subject}</p>
          {negotiation && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              {negotiation.source === "service"
                ? "Discussion liée à une annonce — négociez le prix ci-dessous"
                : "Discussion liée à une proposition — négociez le prix ci-dessous"}
            </p>
          )}
          {conversation.isDirect && !negotiation && (
            <p className="text-xs text-muted-foreground mt-1">Discussion directe</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function MessageBubbleList({
  messages,
  hasMore,
  loadingOlder,
  isProvider,
  negotiation,
  acceptingId,
  bottomRef,
  onLoadOlder,
  onAcceptPrice,
}: {
  messages: SerializedMessage[];
  hasMore: boolean;
  loadingOlder: boolean;
  isProvider: boolean;
  negotiation: NegotiationContext | null;
  acceptingId: string | null;
  bottomRef: RefObject<HTMLDivElement | null>;
  onLoadOlder: () => void;
  onAcceptPrice: (messageId: string) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto bg-card rounded-2xl border border-border shadow-sm p-4 mb-4 flex flex-col gap-3">
      {hasMore && (
        <button
          type="button"
          onClick={onLoadOlder}
          disabled={loadingOlder}
          className="self-center text-sm text-brand-700 hover:underline disabled:opacity-50"
        >
          {loadingOlder ? "Chargement..." : "Messages plus anciens"}
        </button>
      )}
      {messages.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          Aucun message. Envoyez le premier !
        </p>
      ) : (
        messages.map((m) => {
          const isPriceOffer = m.kind === "PRICE_OFFER";
          const canAccept =
            isPriceOffer &&
            m.offerStatus === "PENDING" &&
            !m.isMine &&
            negotiation?.canNegotiate !== false;

          return (
            <div
              key={m.id}
              className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  isPriceOffer
                    ? m.isMine
                      ? "bg-amber-600 text-white rounded-br-md"
                      : "bg-amber-50 text-amber-950 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-50 dark:border-amber-800 rounded-bl-md"
                    : m.isMine
                      ? "bg-brand-600 text-white rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                {isPriceOffer && (
                  <p
                    className={`text-xs font-semibold mb-1 ${
                      m.isMine ? "text-amber-100" : "text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    💰 Proposition de prix
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">
                  {isPriceOffer && m.offerPrice !== null
                    ? `${m.offerPrice.toLocaleString("fr-MG")} Ar`
                    : m.body}
                </p>
                {isProvider &&
                  isPriceOffer &&
                  negotiation &&
                  m.offerPrice != null && (
                    <ServiceCommissionHint
                      className="mt-1.5"
                      category={negotiation.category}
                      price={m.offerPrice}
                      frozenRate={
                        negotiation.bookingId
                          ? negotiation.commissionRate
                          : undefined
                      }
                      variant="compact"
                      tone={m.isMine ? "onAccent" : "onSoft"}
                    />
                  )}
                {m.offerStatus === "ACCEPTED" && (
                  <p
                    className={`text-xs mt-1 font-medium ${
                      m.isMine ? "text-amber-100" : "text-brand-700 dark:text-brand-300"
                    }`}
                  >
                    ✓ Accepté
                  </p>
                )}
                {m.offerStatus === "SUPERSEDED" && (
                  <p
                    className={`text-xs mt-1 ${
                      m.isMine ? "text-amber-200" : "text-muted-foreground"
                    }`}
                  >
                    Remplacée
                  </p>
                )}
                {canAccept && (
                  <button
                    type="button"
                    onClick={() => onAcceptPrice(m.id)}
                    disabled={acceptingId === m.id}
                    className="mt-2 bg-brand-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50"
                  >
                    {acceptingId === m.id ? "..." : "Accepter ce prix"}
                  </button>
                )}
                <p
                  className={`text-xs mt-1 ${
                    m.isMine
                      ? isPriceOffer
                        ? "text-amber-100"
                        : "text-brand-100"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
