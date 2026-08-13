import { SUBSCRIPTION_PERIOD_DAYS } from "@/lib/subscription";

export const SUBSCRIPTION_MONTHLY_PRICE_MGA = Number(
  process.env.SUBSCRIPTION_MONTHLY_PRICE_MGA ?? 29_000
);

export type SubscriptionPlanId = "1-month" | "3-months";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  months: number;
  label: string;
  description: string;
  priceMGA: number;
  savingsLabel?: string;
}

export const SUBSCRIPTION_BENEFITS = [
  "Mise en avant automatique de votre profil sur l'accueil",
  "Section « Nos suggestions » sur la page de recherche",
  "Choix d'une annonce à mettre en avant sur l'accueil",
  `Validité ${SUBSCRIPTION_PERIOD_DAYS} jours par période`,
] as const;

export function getSubscriptionPlans(): SubscriptionPlan[] {
  const monthly = SUBSCRIPTION_MONTHLY_PRICE_MGA;

  return [
    {
      id: "1-month",
      months: 1,
      label: "1 mois",
      description: `${SUBSCRIPTION_PERIOD_DAYS} jours de visibilité premium`,
      priceMGA: monthly,
    },
    {
      id: "3-months",
      months: 3,
      label: "3 mois",
      description: `${SUBSCRIPTION_PERIOD_DAYS * 3} jours de visibilité premium`,
      priceMGA: Math.round(monthly * 3 * 0.9),
      savingsLabel: "−10 %",
    },
  ];
}

export function getPlanByMonths(months: number): SubscriptionPlan | undefined {
  return getSubscriptionPlans().find((p) => p.months === months);
}

export function getPlanPrice(months: number): number {
  const plan = getPlanByMonths(months);
  if (!plan) return SUBSCRIPTION_MONTHLY_PRICE_MGA * months;
  return plan.priceMGA;
}

export const PAYMENT_METHOD_OPTIONS = [
  { id: "ORANGE_MONEY" as const, label: "Orange Money", hint: "Composez #144#" },
  { id: "MVOLA" as const, label: "MVola", hint: "Application Telma" },
  { id: "AIRTEL_MONEY" as const, label: "Airtel Money", hint: "Application Airtel" },
];

export function isValidMgPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return /^0(3[0-9]{8}|20[0-9]{7})$/.test(digits);
}

export function normalizeMgPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
