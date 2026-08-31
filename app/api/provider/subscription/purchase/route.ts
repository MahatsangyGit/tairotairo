import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow, requireRole, requireEmailVerified } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import { activateProviderSubscription } from "@/lib/activate-provider-subscription";
import {
  getPlanByMonths,
  getPlanPrice,
  isValidMgPhone,
  normalizeMgPhone,
} from "@/lib/subscription-plans";
import {
  parseBody,
  parseJsonBody,
  subscriptionPurchaseSchema,
} from "@/lib/api-schemas";

export const dynamic = "force-dynamic";

function generateReferenceId(): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SUB-${Date.now()}-${suffix}`;
}

export const POST = withApiHandler(
  "POST /api/provider/subscription/purchase",
  async (req) => {
    const auth = await requireAuthOrThrow(req);
    requireRole(auth, "PROVIDER", "Réservé aux prestataires");

    await requireEmailVerified(auth);

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(subscriptionPurchaseSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { months, paymentMethod } = parsed.data;
    const phone = normalizeMgPhone(parsed.data.phone);

    if (!isValidMgPhone(phone)) {
      return NextResponse.json(
        { error: "Numéro invalide (format malgache : 03X XX XXX XX)" },
        { status: 400 }
      );
    }

    const plan = getPlanByMonths(months);
    if (!plan) {
      return NextResponse.json(
        { error: "Durée d'abonnement non disponible" },
        { status: 400 }
      );
    }

    const amount = getPlanPrice(months);
    const referenceId = generateReferenceId();

    const payment = await prisma.providerSubscriptionPayment.create({
      data: {
        providerId: auth.userId,
        months,
        amount,
        paymentMethod: paymentMethod as "ORANGE_MONEY" | "MVOLA" | "AIRTEL_MONEY",
        phone,
        referenceId,
        status: "PENDING",
      },
    });

    const simulate =
      process.env.SUBSCRIPTION_PAYMENT_SIMULATE !== "false" &&
      process.env.NODE_ENV !== "production"
        ? true
        : process.env.SUBSCRIPTION_PAYMENT_SIMULATE === "true";

    if (!simulate) {
      return NextResponse.json(
        {
          message:
            "Paiement initié. Confirmez la transaction sur votre téléphone, puis contactez le support avec la référence.",
          payment: {
            id: payment.id,
            referenceId: payment.referenceId,
            amount: payment.amount,
            status: payment.status,
            paymentMethod: payment.paymentMethod,
          },
          pending: true,
        },
        { status: 202 }
      );
    }

    await prisma.providerSubscriptionPayment.update({
      where: { id: payment.id },
      data: { status: "SUCCESS" },
    });

    const activation = await activateProviderSubscription(
      auth.userId,
      months,
      `Paiement en ligne ${referenceId}`
    );

    return NextResponse.json({
      message: activation.message,
      payment: {
        id: payment.id,
        referenceId,
        amount,
        status: "SUCCESS",
        paymentMethod: payment.paymentMethod,
      },
      subscription: activation.subscription,
      spotlightEnabled: activation.spotlightEnabled,
    });
  }
);
