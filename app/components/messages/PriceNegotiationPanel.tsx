"use client";

import { useState } from "react";
import type { NegotiationContext } from "@/lib/price-negotiation-types";
import { useAuth } from "@/components/auth/AuthProvider";
import ServiceCommissionHint from "@/components/economy/ServiceCommissionHint";

interface PriceNegotiationPanelProps {
  conversationId: string;
  negotiation: NegotiationContext;
  onUpdated: () => void;
}

export default function PriceNegotiationPanel({
  conversationId,
  negotiation,
  onUpdated,
}: PriceNegotiationPanelProps) {
  const { user } = useAuth();
  const isProvider = user?.role === "PROVIDER";

  const referencePrice =
    negotiation.source === "service"
      ? negotiation.listPrice
      : negotiation.referencePrice;

  const title =
    negotiation.source === "service"
      ? negotiation.serviceTitle
      : negotiation.requestTitle;

  const currentPrice =
    negotiation.source === "service"
      ? negotiation.currentPrice
      : negotiation.currentPrice;

  const [priceInput, setPriceInput] = useState(
    (currentPrice ?? referencePrice).toString()
  );
  const [proposing, setProposing] = useState(false);
  const [error, setError] = useState("");
  const offerPrice = Number(priceInput);

  const handlePropose = async () => {
    const price = parseFloat(priceInput);
    if (Number.isNaN(price) || price < 0) {
      setError("Indiquez un prix valide");
      return;
    }

    setProposing(true);
    setError("");

    const body =
      negotiation.source === "service"
        ? { price, serviceId: negotiation.serviceId }
        : { price, requestResponseId: negotiation.requestResponseId };

    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/price-offers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ??
            (res.status === 500
              ? "Erreur serveur — redémarrez le serveur après prisma generate"
              : "Envoi impossible")
        );
        return;
      }

      onUpdated();
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setProposing(false);
    }
  };

  if (!negotiation.canNegotiate) return null;

  return (
    <div className="bg-amber-50 border border-amber-100 dark:bg-amber-950/40 dark:border-amber-800/50 rounded-2xl p-4 mb-4">
      <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">Marchandage</p>
      <p className="text-xs text-amber-800 dark:text-amber-200 mb-3">
        {negotiation.source === "service" ? "Annonce : " : "Demande : "}
        {title}
        {" · "}
        {negotiation.source === "service" ? (
          <>
            Prix affiché{" "}
            <span className="font-semibold">
              {negotiation.listPrice.toLocaleString("fr-MG")} Ar
            </span>
          </>
        ) : (
          <>
            Budget{" "}
            <span className="font-semibold">
              {negotiation.referencePrice.toLocaleString("fr-MG")} Ar
            </span>
          </>
        )}
        {currentPrice !== null && negotiation.source === "request" && (
          <>
            {" "}
            · Prix actuel :{" "}
            <span className="font-semibold">
              {currentPrice.toLocaleString("fr-MG")} Ar
            </span>
          </>
        )}
        {negotiation.source === "service" &&
          currentPrice !== negotiation.listPrice && (
            <>
              {" "}
              · Prix convenu :{" "}
              <span className="font-semibold">
                {(currentPrice ?? negotiation.listPrice).toLocaleString("fr-MG")}{" "}
                Ar
              </span>
            </>
          )}
        {negotiation.bookingId && (
          <span className="block mt-1 text-amber-700 dark:text-amber-300">
            Réservation liée — le prix accepté sera appliqué automatiquement.
          </span>
        )}
        {negotiation.source === "service" && !negotiation.bookingId && (
          <span className="block mt-1 text-amber-700 dark:text-amber-300">
            À l&apos;acceptation, une réservation sera créée avec ce prix (date à
            confirmer ensuite).
          </span>
        )}
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[140px]">
          <label
            htmlFor="price-offer-input"
            className="text-xs text-amber-800 dark:text-amber-200 block mb-1"
          >
            Montant (Ar)
          </label>
          <input
            id="price-offer-input"
            type="number"
            min={0}
            step={1000}
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            className="w-full px-3 py-2 border border-amber-200 dark:border-amber-800 rounded-xl text-sm bg-card text-foreground focus:outline-none focus:border-amber-400 dark:focus:border-amber-600"
          />
        </div>
        <button
          type="button"
          onClick={handlePropose}
          disabled={proposing}
          className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {proposing ? "..." : "Proposer un prix"}
        </button>
      </div>

      {isProvider && (
        <ServiceCommissionHint
          className="mt-3"
          category={negotiation.category}
          price={offerPrice}
          frozenRate={
            negotiation.bookingId ? negotiation.commissionRate : undefined
          }
        />
      )}

      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  );
}
