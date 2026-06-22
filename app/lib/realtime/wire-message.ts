import type { WireMessage } from "@/lib/realtime/types";

type DbMessage = {
  id: string;
  body: string;
  kind?: string | null;
  offerPrice?: number | null;
  offerStatus?: string | null;
  createdAt: Date | string;
  sender: { id: string; name: string; avatar: string | null };
};

export function toWireMessage(m: DbMessage): WireMessage {
  const createdAt =
    typeof m.createdAt === "string"
      ? m.createdAt
      : m.createdAt instanceof Date
        ? m.createdAt.toISOString()
        : new Date().toISOString();

  const isPriceOffer =
    m.kind === "PRICE_OFFER" ||
    (m.offerPrice !== null && m.offerPrice !== undefined);

  return {
    id: m.id,
    body: m.body,
    kind: isPriceOffer ? "PRICE_OFFER" : "TEXT",
    offerPrice:
      m.offerPrice === null || m.offerPrice === undefined
        ? null
        : Number(m.offerPrice),
    offerStatus: (m.offerStatus ??
      (isPriceOffer ? "PENDING" : null)) as WireMessage["offerStatus"],
    createdAt,
    sender: {
      id: m.sender.id,
      name: m.sender.name,
      avatar: m.sender.avatar,
    },
  };
}
