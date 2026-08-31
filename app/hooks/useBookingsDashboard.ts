"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, apiFetchJson } from "@/lib/api-client";
import { messageFromApiAction } from "@/lib/api-action-error";
import type { BookingStatus } from "@/lib/booking-status";

export function useBookingsDashboard<T extends { id: string; status: string }>({
  listUrl,
  viewer,
  abortTimeoutMs = null,
}: {
  listUrl: string;
  viewer: "client" | "provider";
  abortTimeoutMs?: number | null;
}) {
  const router = useRouter();
  const fetchSeqRef = useRef(0);
  const activeFetchControllerRef = useRef<AbortController | null>(null);

  const [bookings, setBookings] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeFilter, setActiveFilter] = useState<BookingStatus | "ALL">(
    "ALL"
  );

  const fetchBookings = useCallback(
    async (options?: { silent?: boolean }) => {
      if (
        abortTimeoutMs != null &&
        options?.silent &&
        activeFetchControllerRef.current
      ) {
        return;
      }

      const fetchSeq = ++fetchSeqRef.current;
      let controller: AbortController | undefined;
      if (abortTimeoutMs != null) {
        activeFetchControllerRef.current?.abort();
        controller = new AbortController();
        activeFetchControllerRef.current = controller;
      }

      if (!options?.silent) {
        setLoading(true);
        setError("");
      } else if (abortTimeoutMs == null) {
        setError("");
      }

      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      try {
        if (abortTimeoutMs != null && controller) {
          timeoutId = setTimeout(() => controller.abort(), abortTimeoutMs);
        }

        const data = await apiFetch<{
          role?: string;
          bookings: T[];
        }>(listUrl, {
          cache: "no-store",
          signal: controller?.signal,
          router,
        });

        if (abortTimeoutMs != null && fetchSeq !== fetchSeqRef.current) return;

        if (viewer === "client" && data.role === "PROVIDER") {
          router.push("/dashboard/provider");
          return;
        }
        if (
          viewer === "provider" &&
          data.role !== "PROVIDER" &&
          data.role !== "ADMIN"
        ) {
          router.push("/dashboard/client");
          return;
        }

        setBookings(data.bookings);
        if (abortTimeoutMs != null) setError("");
      } catch (err) {
        if (abortTimeoutMs != null && fetchSeq !== fetchSeqRef.current) return;
        if (options?.silent) return;
        if (err instanceof DOMException && err.name === "AbortError") {
          setError("Le serveur met trop de temps à répondre. Réessayez.");
        } else {
          const message = messageFromApiAction(err);
          if (message) setError(message);
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        if (abortTimeoutMs != null) {
          if (fetchSeq === fetchSeqRef.current) {
            activeFetchControllerRef.current = null;
            setLoading(false);
          }
        } else if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [abortTimeoutMs, listUrl, router, viewer]
  );

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchBookings({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (abortTimeoutMs != null) {
        activeFetchControllerRef.current?.abort();
      }
    };
  }, [abortTimeoutMs, fetchBookings]);

  const updateBookingInState = useCallback((id: string, updated: Partial<T>) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updated } : b))
    );
  }, []);

  const patchBooking = useCallback(
    async (id: string, body: unknown) => {
      setActionError("");
      try {
        const data = await apiFetchJson<{ booking?: Partial<T> }>(
          `/api/bookings/${id}`,
          { method: "PATCH", body, router }
        );
        if (data.booking) {
          updateBookingInState(id, data.booking);
        }
        return data.booking;
      } catch (err) {
        const message = messageFromApiAction(err);
        if (message) setActionError(message);
        throw err;
      }
    },
    [router, updateBookingInState]
  );

  const filtered =
    activeFilter === "ALL"
      ? bookings
      : bookings.filter((b) => b.status === activeFilter);

  const counts = bookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    router,
    bookings,
    setBookings,
    loading,
    error,
    actionError,
    setActionError,
    activeFilter,
    setActiveFilter,
    filtered,
    counts,
    fetchBookings,
    updateBookingInState,
    patchBooking,
  };
}
