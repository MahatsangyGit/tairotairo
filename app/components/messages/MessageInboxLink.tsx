"use client";

import { useCallback, useEffect, useState } from "react";
import { useMessagingRealtime } from "@/components/messages/MessagingRealtimeProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMessageCircle as MessageCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { isNavLinkActive } from "@/lib/nav-active";
import { cn } from "@/lib/utils";

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
  const active = isNavLinkActive(pathname, href);

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
  }, [fetchUnread, pathname]);

  useMessagingRealtime((event) => {
    if (event.type === "inbox.changed") {
      fetchUnread();
    }
  });

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
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "relative size-9 text-muted-foreground hover:text-foreground",
        active && "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
      )}
      asChild
    >
      <Link
        href={href}
        title="Messages"
        aria-label={
          unreadTotal > 0
            ? `Messages (${unreadTotal} non lu${unreadTotal > 1 ? "s" : ""})`
            : "Messages"
        }
      >
        <MessageCircle className="size-4" />
        {unreadTotal > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-brand-600 text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-background">
            {unreadTotal > 9 ? "9+" : unreadTotal}
          </span>
        )}
      </Link>
    </Button>
  );
}
