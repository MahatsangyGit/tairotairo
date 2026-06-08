"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MessageInboxLinkProps {
  href: string;
  variant?: "icon" | "nav";
}

export default function MessageInboxLink({
  href,
  variant = "icon",
}: MessageInboxLinkProps) {
  const pathname = usePathname();
  const [unreadTotal, setUnreadTotal] = useState(0);
  const active = pathname === href || pathname.startsWith(`${href}/`);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations/unread-count");
      if (res.status === 401) return;
      const data = await res.json();
      if (res.ok) {
        setUnreadTotal(data.unreadTotal ?? 0);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread, pathname]);

  if (variant === "nav") {
    return (
      <Link
        href={href}
        className={`text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
          active
            ? "text-brand-600"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Messages
        {unreadTotal > 0 && (
          <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-brand-600 text-white text-[10px] font-bold rounded-full px-1">
            {unreadTotal > 9 ? "9+" : unreadTotal}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`relative p-2 rounded-lg transition-colors ${
        active
          ? "text-brand-600 bg-brand-50"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
      title="Messages"
      aria-label={
        unreadTotal > 0
          ? `Messages (${unreadTotal} non lu${unreadTotal > 1 ? "s" : ""})`
          : "Messages"
      }
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 0 1-4-.8L3 21l1.8-4.2A7.96 7.96 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
      {unreadTotal > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-brand-600 text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-white">
          {unreadTotal > 9 ? "9+" : unreadTotal}
        </span>
      )}
    </Link>
  );
}
