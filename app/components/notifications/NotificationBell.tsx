"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=15");
      if (res.status === 401) return;
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAsRead = async (id: string, link: string | null) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    setOpen(false);
    if (link) router.push(link);
  };

  const markAllRead = async () => {
    setLoading(true);
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    setLoading(false);
  };

  const clearAll = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/clear-all", {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
        setShowClearDialog(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "relative size-9 text-muted-foreground hover:text-foreground",
          open && "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
        )}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} non lue${unreadCount > 1 ? "s" : ""})`
            : "Notifications"
        }
        aria-expanded={open}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-brand-600 text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <Card
          size="sm"
          className="absolute right-0 mt-2 w-80 sm:w-96 z-50 gap-0 py-0 shadow-lg"
        >
          <CardHeader className="border-b border-border py-3">
            <CardTitle>Notifications</CardTitle>
            {notifications.length > 0 && (
              <CardAction>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      disabled={loading}
                      onClick={markAllRead}
                    >
                      Tout marquer lu
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    disabled={loading}
                    className="text-destructive hover:text-destructive"
                    onClick={() => setShowClearDialog(true)}
                  >
                    Effacer
                  </Button>
                </div>
              </CardAction>
            )}
          </CardHeader>

          <CardContent className="p-0 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-10 px-4">
                Aucune notification
              </p>
            ) : (
              <ul className="flex flex-col">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => markAsRead(n.id, n.link)}
                      className={cn(
                        "w-full text-left px-4 py-3 border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors",
                        !n.read && "bg-tertiary-50/80 dark:bg-tertiary-50"
                      )}
                    >
                      <p className="font-medium text-foreground text-sm">
                        {n.title}
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                      <p className="text-muted-foreground text-[10px] mt-1">
                        {new Date(n.createdAt).toLocaleString("fr-MG", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Effacer les notifications"
        description="Effacer toutes les notifications ?"
        confirmLabel="Effacer"
        destructive
        loading={loading}
        onConfirm={clearAll}
      />
    </div>
  );
}
