/** Message transmis sur le fil WebSocket (sans isMine — dérivé côté client). */
export type WireMessage = {
  id: string;
  body: string;
  kind: "TEXT" | "PRICE_OFFER";
  offerPrice: number | null;
  offerStatus: "PENDING" | "ACCEPTED" | "SUPERSEDED" | null;
  createdAt: string;
  sender: { id: string; name: string; avatar: string | null };
};

export type RealtimeServerEvent =
  | { type: "connected" }
  | { type: "message.created"; conversationId: string; message: WireMessage }
  | { type: "thread.refresh"; conversationId: string }
  | { type: "inbox.changed" };

export type RealtimeClientEvent =
  | { type: "ping" }
  | { type: "subscribe"; conversationId: string }
  | { type: "unsubscribe"; conversationId: string };

export type ConversationParticipants = {
  clientId: string;
  providerId: string;
};
