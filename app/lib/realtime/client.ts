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

export function getMessagingWebSocketUrl(): string {
  if (typeof window === "undefined") return "";

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/messaging`;
}
