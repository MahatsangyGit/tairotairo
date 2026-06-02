"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OpenUserChatButtonProps {
  bookingId?: string;
  providerId?: string;
  clientId?: string;
  label?: string;
  className?: string;
}

export default function OpenUserChatButton({
  bookingId,
  providerId,
  clientId,
  label = "Message",
  className = "",
}: OpenUserChatButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/conversations/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, providerId, clientId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          const callback = window.location.pathname;
          router.push(`/auth/login?callbackUrl=${encodeURIComponent(callback)}`);
          return;
        }
        alert(data.error ?? "Impossible d'ouvrir la conversation");
        return;
      }

      router.push(data.href);
    } catch {
      alert("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={loading}
      className={
        className ||
        "text-sm text-emerald-600 font-medium border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 disabled:opacity-50"
      }
    >
      {loading ? "..." : label}
    </button>
  );
}
