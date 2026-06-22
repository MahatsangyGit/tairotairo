"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getMessagingWebSocketUrl } from "@/lib/realtime/client";
import type { RealtimeServerEvent } from "@/lib/realtime/types";

type Listener = (event: RealtimeServerEvent) => void;

interface MessagingRealtimeContextValue {
  connected: boolean;
  userId: string | null;
  subscribe: (listener: Listener) => () => void;
}

const MessagingRealtimeContext =
  createContext<MessagingRealtimeContextValue | null>(null);

const MAX_RECONNECT_DELAY_MS = 30_000;

function parseServerEvent(raw: string): RealtimeServerEvent | null {
  try {
    const data = JSON.parse(raw) as RealtimeServerEvent;
    if (!data || typeof data !== "object" || !("type" in data)) return null;
    return data;
  } catch {
    return null;
  }
}

export function MessagingRealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef(new Set<Listener>());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldConnectRef = useRef(true);

  const emit = useCallback((event: RealtimeServerEvent) => {
    for (const listener of listenersRef.current) {
      listener(event);
    }
  }, []);

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setConnected(false);
      return;
    }

    shouldConnectRef.current = true;

    const scheduleReconnect = () => {
      if (!shouldConnectRef.current) return;

      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(1000 * 2 ** attempt, MAX_RECONNECT_DELAY_MS);
      reconnectAttemptRef.current = attempt + 1;

      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    const connect = () => {
      if (!shouldConnectRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      const ws = new WebSocket(getMessagingWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        setConnected(true);
      };

      ws.onmessage = (message) => {
        const event = parseServerEvent(
          typeof message.data === "string" ? message.data : String(message.data)
        );
        if (event) emit(event);
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 25_000);

    return () => {
      shouldConnectRef.current = false;
      clearInterval(pingInterval);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
      wsRef.current = null;
      setConnected(false);
    };
  }, [userId, emit]);

  const value = useMemo(
    () => ({ connected, userId, subscribe }),
    [connected, userId, subscribe]
  );

  return (
    <MessagingRealtimeContext.Provider value={value}>
      {children}
    </MessagingRealtimeContext.Provider>
  );
}

export function useMessagingRealtimeContext() {
  return useContext(MessagingRealtimeContext);
}

export function useMessagingRealtime(
  handler: (event: RealtimeServerEvent) => void,
  enabled = true
) {
  const context = useMessagingRealtimeContext();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled || !context) return;
    return context.subscribe((event) => handlerRef.current(event));
  }, [enabled, context]);
}
