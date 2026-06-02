"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  body: string;
  createdAt: string;
  isMine: boolean;
  sender: { id: string; name: string; avatar: string | null };
}

interface ConversationMeta {
  id: string;
  bookingId: string | null;
  subject: string;
  isDirect?: boolean;
  bookingStatus: string | null;
  counterparty: { id: string; name: string; avatar: string | null };
}

interface MessageThreadViewProps {
  conversationId: string;
  backHref: string;
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
}: MessageThreadViewProps) {
  const router = useRouter();
  const [conversation, setConversation] = useState<ConversationMeta | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const canSend = true;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
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
  }, [conversationId, router]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || !canSend) return;

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

  if (loading) {
    return <p className="text-gray-500">Chargement...</p>;
  }

  if (error && !conversation) {
    return (
      <div>
        <Link href={backHref} className="text-sm text-emerald-600 hover:underline mb-4 inline-block">
          ← Retour aux messages
        </Link>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!conversation) return null;

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
          <p className="font-semibold text-gray-800">{conversation.counterparty.name}</p>
          <p className="text-sm text-gray-500">{conversation.subject}</p>
          {conversation.isDirect && (
            <p className="text-xs text-gray-500 mt-1">Discussion directe</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            Aucun message. Envoyez le premier !
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  m.isMine
                    ? "bg-emerald-600 text-white rounded-br-md"
                    : "bg-gray-100 text-gray-800 rounded-bl-md"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                <p
                  className={`text-xs mt-1 ${
                    m.isMine ? "text-emerald-100" : "text-gray-400"
                  }`}
                >
                  {formatTime(m.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {canSend ? (
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
      ) : (
        <p className="text-sm text-gray-500 text-center py-2">
          Cette conversation est en lecture seule.
        </p>
      )}
    </div>
  );
}
