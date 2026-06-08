"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PortfolioItemPayload } from "@/lib/portfolio";
import { PORTFOLIO_MAX_COMMENT_LENGTH } from "@/lib/portfolio";
import UserAvatar from "@/components/profile/UserAvatar";

interface ProviderPortfolioPublicProps {
  providerId: string;
  initialItems: PortfolioItemPayload[];
}

export default function ProviderPortfolioPublic({
  providerId,
  initialItems,
}: ProviderPortfolioPublicProps) {
  const [items, setItems] = useState(initialItems);
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setAuthRole(data.user?.role ?? null);
        setAuthUserId(data.user?.id ?? null);
      })
      .catch(() => {});
  }, []);

  const canComment =
    authRole === "CLIENT" || authRole === "ADMIN"
      ? authUserId !== providerId
      : false;

  const submitComment = async (itemId: string) => {
    const body = (commentDrafts[itemId] ?? "").trim();
    if (!body) return;

    setSubmittingId(itemId);
    setError("");

    try {
      const res = await fetch(`/api/provider/portfolio/${itemId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError("Connectez-vous en tant que client pour commenter.");
          return;
        }
        setError(data.error ?? "Envoi impossible");
        return;
      }

      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? data.item : i))
      );
      setCommentDrafts((d) => ({ ...d, [itemId]: "" }));
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setSubmittingId(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Portfolio ({items.length})
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {items.map((item) => (
          <article
            key={item.id}
            className="bg-card rounded-xl border border-border overflow-hidden shadow-sm"
          >
            <img
              src={item.imageUrl}
              alt=""
              className="w-full h-48 object-cover bg-gray-100"
            />
            <div className="p-4">
              <p className="text-muted-foreground text-sm whitespace-pre-line leading-relaxed">
                {item.description}
              </p>

              {item.comments.length > 0 && (
                <ul className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4">
                  {item.comments.map((comment) => (
                    <li key={comment.id} className="flex gap-2">
                      <UserAvatar
                        name={comment.author.name}
                        avatar={comment.author.avatar}
                        size="xs"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground">
                          {comment.author.name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {comment.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.createdAt).toLocaleDateString("fr-MG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {canComment ? (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <textarea
                    placeholder="Laisser un commentaire…"
                    rows={2}
                    maxLength={PORTFOLIO_MAX_COMMENT_LENGTH}
                    value={commentDrafts[item.id] ?? ""}
                    onChange={(e) =>
                      setCommentDrafts((d) => ({
                        ...d,
                        [item.id]: e.target.value,
                      }))
                    }
                    className="w-full text-sm px-3 py-2 border border-border rounded-lg resize-none focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    disabled={
                      submittingId === item.id ||
                      !(commentDrafts[item.id] ?? "").trim()
                    }
                    onClick={() => submitComment(item.id)}
                    className="mt-2 text-sm text-brand-600 font-medium hover:underline disabled:opacity-50"
                  >
                    {submittingId === item.id ? "Publication…" : "Publier le commentaire"}
                  </button>
                </div>
              ) : authRole === null ? (
                <p className="mt-4 text-xs text-muted-foreground border-t border-gray-100 pt-3">
                  <Link href="/auth/login" className="text-brand-600 hover:underline">
                    Connectez-vous
                  </Link>{" "}
                  en tant que client pour commenter.
                </p>
              ) : authRole === "PROVIDER" && authUserId === providerId ? null : authRole === "PROVIDER" ? (
                <p className="mt-4 text-xs text-muted-foreground border-t border-gray-100 pt-3">
                  Les commentaires sont réservés aux clients.
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
    </section>
  );
}
