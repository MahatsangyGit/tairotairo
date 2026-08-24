"use client";

import {
  formatCommissionPercent,
  formatMgaAmount,
  RENTAL_PARTICULAR_COMMISSION_RATE,
  RENTAL_PRO_TIERS,
  rentalCommissionSplit,
  splitAmount,
} from "@/lib/economy";

export default function RentalCommissionHint({
  isPlatformOwned,
  ownerIsProfessionalClient,
  totalAmount,
  frozenRate,
}: {
  isPlatformOwned?: boolean;
  ownerIsProfessionalClient: boolean;
  totalAmount?: number;
  frozenRate?: number;
}) {
  if (isPlatformOwned) {
    return (
      <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted/40 px-3 py-2">
        Catalogue Tairo : 0 % de commission. Le loyer est versé sur le compte
        Mobile Money de Tairo.
      </p>
    );
  }

  if (ownerIsProfessionalClient) {
    const knownTotal =
      Number.isFinite(totalAmount) && (totalAmount ?? 0) > 0
        ? (totalAmount as number)
        : null;
    const split =
      knownTotal != null
        ? frozenRate != null
          ? splitAmount(knownTotal, frozenRate)
          : rentalCommissionSplit({
              isPlatformOwned: false,
              ownerIsProfessionalClient: true,
              totalAmount: knownTotal,
            })
        : null;

    return (
      <div className="text-sm text-muted-foreground rounded-lg border border-border bg-muted/40 px-3 py-2 space-y-2">
        <p>
          Commission Tairo sur le <strong className="text-foreground">total</strong> de
          chaque location (hors caution) :
        </p>
        <ul className="list-disc pl-5 space-y-0.5">
          {RENTAL_PRO_TIERS.map((tier) => (
            <li key={tier.label}>
              {formatCommissionPercent(tier.rate)} {tier.label}
            </li>
          ))}
        </ul>
        {split ? (
          <p>
            Cette location : {formatCommissionPercent(split.rate)} — vous
            recevrez{" "}
            <span className="font-medium text-foreground">
              {formatMgaAmount(split.net)}
            </span>
            .
          </p>
        ) : null}
      </div>
    );
  }

  const particularTotal =
    Number.isFinite(totalAmount) && (totalAmount ?? 0) > 0
      ? (totalAmount as number)
      : null;
  const particularSplit =
    particularTotal != null
      ? splitAmount(
          particularTotal,
          frozenRate ?? RENTAL_PARTICULAR_COMMISSION_RATE
        )
      : null;

  return (
    <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted/40 px-3 py-2">
      Commission Tairo {formatCommissionPercent(RENTAL_PARTICULAR_COMMISSION_RATE)}{" "}
      sur le loyer de chaque location. La caution, si vous en demandez une,
      n&apos;est pas commissionnée.
      {particularSplit ? (
        <>
          {" "}
          Vous recevrez{" "}
          <span className="font-medium text-foreground">
            {formatMgaAmount(particularSplit.net)}
          </span>
          .
        </>
      ) : null}
    </p>
  );
}
