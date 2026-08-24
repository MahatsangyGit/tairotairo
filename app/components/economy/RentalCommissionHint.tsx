"use client";

import CommissionBreakdown from "@/components/economy/CommissionBreakdown";
import {
  formatCommissionPercent,
  RENTAL_PARTICULAR_COMMISSION_RATE,
  RENTAL_PRO_TIERS,
  rentalCommissionRate,
} from "@/lib/economy";

export default function RentalCommissionHint({
  isPlatformOwned,
  ownerIsProfessionalClient,
  totalAmount,
  frozenRate,
  tariffLabel = "Loyer",
}: {
  isPlatformOwned?: boolean;
  ownerIsProfessionalClient: boolean;
  totalAmount?: number;
  frozenRate?: number;
  tariffLabel?: string;
}) {
  if (isPlatformOwned) {
    return (
      <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted/40 px-3 py-2">
        Catalogue Tairo : 0 % de commission. Le loyer est versé sur le compte
        Mobile Money de Tairo.
      </p>
    );
  }

  const amount =
    typeof totalAmount === "number" && Number.isFinite(totalAmount) && totalAmount > 0
      ? totalAmount
      : null;

  const rate =
    frozenRate ??
    (amount != null
      ? rentalCommissionRate({
          isPlatformOwned: false,
          ownerIsProfessionalClient,
          totalAmount: amount,
        })
      : RENTAL_PARTICULAR_COMMISSION_RATE);

  return (
    <div className="space-y-2">
      {ownerIsProfessionalClient ? (
        <p className="text-xs text-muted-foreground">
          Le pourcentage dépend du total de chaque location (hors caution) :{" "}
          {RENTAL_PRO_TIERS.map((tier, index) => (
            <span key={tier.label}>
              {formatCommissionPercent(tier.rate)} {tier.label}
              {index < RENTAL_PRO_TIERS.length - 1 ? " · " : ""}
            </span>
          ))}
          . L&apos;aperçu se met à jour selon le tarif saisi.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Commission fixe {formatCommissionPercent(RENTAL_PARTICULAR_COMMISSION_RATE)}{" "}
          sur le loyer. La caution n&apos;est pas commissionnée.
        </p>
      )}
      {amount != null ? (
        <CommissionBreakdown
          rate={rate}
          gross={amount}
          tariffLabel={tariffLabel}
        />
      ) : (
        <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted/40 px-3 py-2">
          Saisissez un tarif pour voir le montant prélevé automatiquement.
        </p>
      )}
    </div>
  );
}
