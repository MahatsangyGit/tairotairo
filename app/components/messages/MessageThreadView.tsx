"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import PriceNegotiationPanel from "@/components/messages/PriceNegotiationPanel";
import type { SerializedMessage } from "@/lib/message-serialize";
import type { NegotiationContext } from "@/lib/price-negotiation-types";

interface ConversationMeta {
  id: string;
  bookingId: string | null;
  subject: string;
  isDirect?: boolean;
  bookingStatus: string | null;
  negotiation: NegotiationContext | null;
  counterparty: { id: string; name: string; avatar: string | null };
}

interface MessageThreadViewProps {
  conversationId: string;
  backHref: string;
  requestResponseId?: string | null;
  serviceId?: string | null;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("fr-MG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageThreadView({
  conversationId,
  backHref,
  requestResponseId,
  serviceId,
}: MessageThreadViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [conversation, setConversation] = useState<ConversationMeta | null>(null);
  const [messages, setMessages] = useState<SerializedMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const apiUrl = (() => {
    const base = `/api/conversations/${conversationId}`;
    if (requestResponseId) {
      return `${base}?response=${encodeURIComponent(requestResponseId)}`;
    }
    if (serviceId) {
      return `${base}?service=${encodeURIComponent(serviceId)}`;
    }
    return base;
  })();

  const load = useCallback(async () => {
    try {
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(
            `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`
          );
          return;
        }
        setError(data.error ?? "Erreur");
        return;
      }

      setConversation(data.conversation);
      setMessages(data.messages);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, router]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!conversation?.negotiation) return;

    const n = conversation.negotiation;
    const hasService = searchParams.get("service");
    const hasResponse = searchParams.get("response");

    if (n.source === "service" && n.serviceId && !hasService) {
      const q = new URLSearchParams(searchParams.toString());
      q.set("service", n.serviceId);
      router.replace(`${pathname}?${q.toString()}`, { scroll: false });
    } else if (
      n.source === "request" &&
      n.requestResponseId &&
      !hasResponse
    ) {
      const q = new URLSearchParams(searchParams.toString());
      q.set("response", n.requestResponseId);
      router.replace(`${pathname}?${q.toString()}`, { scroll: false });
    }
  }, [conversation, pathname, router, searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");

    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Envoi impossible");
        return;
      }

      setMessages((prev) => [...prev, data.message]);
      setDraft("");
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setSending(false);
    }
  };

  const handleAcceptPrice = async (messageId: string) => {
    setAcceptingId(messageId);
    setError("");

    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/price-offers/${messageId}/accept`,
        { method: "POST" }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Acceptation impossible");
        return;
      }

      await load();
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Chargement...</p>;
  }

  if (error && !conversation) {
    return (
      <div>
        <Link
          href={backHref}
          className="text-sm text-emerald-600 hover:underline mb-4 inline-block"
        >
          ← Retour aux messages
        </Link>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!conversation) return null;

  const negotiation = conversation.negotiation;

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[420px]">
      <div className="mb-4">
        <Link
          href={backHref}
          className="text-sm text-emerald-600 hover:underline mb-3 inline-block"
        >
          ← Retour aux messages
        </Link>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="font-semibold text-gray-800">
            {conversation.counterparty.name}
          </p>
          <p className="text-sm text-gray-500">{conversation.subject}</p>
          {negotiation && (
            <p className="text-xs text-amber-700 mt-1">
              {negotiation.source === "service"
                ? "Discussion liée à une annonce — négociez le prix ci-dessous"
                : "Discussion liée à une proposition — négociez le prix ci-dessous"}
            </p>
          )}
          {conversation.isDirect && !negotiation && (
            <p className="text-xs text-gray-500 mt-1">Discussion directe</p>
          )}
        </div>
      </div>

      {negotiation && (
        <PriceNegotiationPanel
          conversationId={conversationId}
          negotiation={negotiation}
          onUpdated={load}
        />
      )}

      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
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
                        : "bg-amber-50 text-amber-950 border border-amber-200 rounded-bl-md"
                      : m.isMine
                        ? "bg-emerald-600 text-white rounded-br-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                  }`}
                >
                  {isPriceOffer && (
                    <p
                      className={`text-xs font-semibold mb-1 ${
                        m.isMine ? "text-amber-100" : "text-amber-700"
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
                  {m.offerStatus === "ACCEPTED" && (
                    <p
                      className={`text-xs mt-1 font-medium ${
                        m.isMine ? "text-amber-100" : "text-emerald-700"
                      }`}
                    >
                      ✓ Accepté
                    </p>
                  )}
                  {m.offerStatus === "SUPERSEDED" && (
                    <p
                      className={`text-xs mt-1 ${
                        m.isMine ? "text-amber-200" : "text-gray-400"
                      }`}
                    >
                      Remplacée
                    </p>
                  )}
                  {canAccept && (
                    <button
                      type="button"
                      onClick={() => handleAcceptPrice(m.id)}
                      disabled={acceptingId === m.id}
                      className="mt-2 bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {acceptingId === m.id ? "..." : "Accepter ce prix"}
                    </button>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      m.isMine
                        ? isPriceOffer
                          ? "text-amber-100"
                          : "text-emerald-100"
                        : "text-gray-400"
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

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Écrivez votre message..."
          rows={2}
          maxLength={2000}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-emerald-500"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 self-end"
        >
          {sending ? "..." : "Envoyer"}
        </button>
      </form>
    </div>
  );
}
