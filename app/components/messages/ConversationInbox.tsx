"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import UserAvatar from "@/components/profile/UserAvatar";
import { useMessagingRealtime } from "@/components/messages/MessagingRealtimeProvider";

interface ConversationItem {
  id: string;
  bookingId: string;
  subject: string;
  bookingStatus: string;
  counterparty: { id: string; name: string; avatar: string | null };
  lastMessage: {
    body: string;
    createdAt: string;
    isMine: boolean;
    senderName: string;
  } | null;
  unreadCount: number;
  href: string;
}

interface ConversationInboxProps {
  emptyHint?: string;
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (sameDay) {
    return d.toLocaleTimeString("fr-MG", { hour: "2-digit", minute: "2-digit" });
  }

  return d.toLocaleDateString("fr-MG", { day: "numeric", month: "short" });
}

export default function ConversationInbox({ emptyHint }: ConversationInboxProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadPage = useCallback(async (cursor: string | null, append: boolean) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    const qs = params.toString();
    const res = await fetch(`/api/conversations${qs ? `?${qs}` : ""}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? "Erreur de chargement");
    }

    setConversations((prev) =>
      append
        ? [
            ...prev,
            ...((data.conversations ?? []) as ConversationItem[]).filter(
              (c) => !prev.some((p) => p.id === c.id)
            ),
          ]
        : (data.conversations ?? [])
    );
    setNextCursor(data.nextCursor ?? null);
    setHasMore(Boolean(data.hasMore));
  }, []);

  const load = useCallback(async () => {
    try {
      setError("");
      await loadPage(null, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadPage(nextCursor, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, nextCursor, loadingMore, loadPage]);

  useEffect(() => {
    load();
  }, [load]);

  useMessagingRealtime((event) => {
    if (event.type === "inbox.changed") {
      load();
    }
  });

  if (loading) {
    return <p className="text-muted-foreground">Chargement des conversations...</p>;
  }

  if (error && conversations.length === 0) {
    return <p className="text-red-500">{error}</p>;
  }

  if (conversations.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
        <p className="text-muted-foreground font-medium mb-2">Aucune conversation</p>
        <p className="text-muted-foreground text-sm">
          {emptyHint ??
            "Ouvrez une conversation depuis une réservation pour échanger avec votre interlocuteur."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <ul className="flex flex-col gap-2">
        {conversations.map((c) => (
          <li key={c.id}>
            <Link
              href={c.href}
              className="flex items-start gap-4 bg-card rounded-2xl border border-border shadow-sm p-4 hover:border-brand-200 transition-colors"
            >
              <UserAvatar
                name={c.counterparty.name}
                avatar={c.counterparty.avatar}
                userId={c.counterparty.id}
                size="md"
                className="w-11 h-11"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-foreground truncate">{c.counterparty.name}</p>
                  {c.lastMessage && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatWhen(c.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{c.subject}</p>
                {c.lastMessage ? (
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {c.lastMessage.isMine ? "Vous : " : ""}
                    {c.lastMessage.body}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1 italic">Aucun message</p>
                )}
              </div>
              {c.unreadCount > 0 && (
                <span className="bg-brand-600 text-white text-xs font-bold min-w-[1.25rem] h-5 px-1.5 rounded-full flex items-center justify-center shrink-0">
                  {c.unreadCount > 9 ? "9+" : c.unreadCount}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-2 self-center text-sm text-brand-700 hover:underline disabled:opacity-50"
        >
          {loadingMore ? "Chargement..." : "Voir plus de conversations"}
        </button>
      )}
    </div>
  );
}
