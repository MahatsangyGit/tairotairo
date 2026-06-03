export type SerializedMessage = {
  id: string;
  body: string;
  kind: "TEXT" | "PRICE_OFFER";
  offerPrice: number | null;
  offerStatus: "PENDING" | "ACCEPTED" | "SUPERSEDED" | null;
  createdAt: string;
  isMine: boolean;
  sender: { id: string; name: string; avatar: string | null };
};

export function serializeMessage(
  m: {
    id: string;
    body: string;
    kind?: string | null;
    offerPrice?: number | null;
    offerStatus?: string | null;
    createdAt: Date | string;
    senderId: string;
    sender: { id: string; name: string; avatar: string | null };
  },
  viewerId: string
): SerializedMessage {
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
      (isPriceOffer ? "PENDING" : null)) as SerializedMessage["offerStatus"],
    createdAt,
    isMine: m.senderId === viewerId,
    sender: {
      id: m.sender.id,
      name: m.sender.name,
      avatar: m.sender.avatar,
    },
  };
}

export function formatPriceOfferBody(price: number): string {
  return `Proposition de prix : ${price.toLocaleString("fr-MG")} Ar`;
}

export function formatPriceAcceptedBody(price: number): string {
  return `Prix accepté — ${price.toLocaleString("fr-MG")} Ar. La réservation a été mise à jour.`;
}
