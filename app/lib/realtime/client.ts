import type { SerializedMessage } from "@/lib/message-serialize";
import type { WireMessage } from "@/lib/realtime/types";

export function wireToSerializedMessage(
  message: WireMessage,
  viewerId: string | null
): SerializedMessage {
  return {
    ...message,
    isMine: viewerId !== null && message.sender.id === viewerId,
  };
}

/**
 * WebSocket messagerie = serveur Node custom (`server.ts`) uniquement.
 * Sur Vercel (serverless), `/ws/messaging` n'existe pas → 404 en boucle.
 *
 * Override : `NEXT_PUBLIC_MESSAGING_WS_ENABLED=1|0`
 */
export function isMessagingWebSocketEnabled(): boolean {
  const override = process.env.NEXT_PUBLIC_MESSAGING_WS_ENABLED;
  if (override === "0" || override === "false") return false;
  if (override === "1" || override === "true") return true;

  // Injecté automatiquement par Vercel au build (production / preview / development).
  if (process.env.NEXT_PUBLIC_VERCEL_ENV) return false;

  return true;
}

export function getMessagingWebSocketUrl(): string {
  if (typeof window === "undefined") return "";

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/messaging`;
}
