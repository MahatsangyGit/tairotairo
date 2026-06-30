import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { activateProviderSubscription } from "@/lib/activate-provider-subscription";
import {
  getPlanByMonths,
  getPlanPrice,
  isValidMgPhone,
  normalizeMgPhone,
  PAYMENT_METHOD_OPTIONS,
} from "@/lib/subscription-plans";
import { serializeSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic";

const VALID_METHODS = PAYMENT_METHOD_OPTIONS.map((m) => m.id);

function generateReferenceId(): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SUB-${Date.now()}-${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (auth.role !== "PROVIDER") {
      return NextResponse.json({ error: "Réservé aux prestataires" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const months = Math.min(12, Math.max(1, parseInt(String(body.months ?? 1), 10) || 1));
    const paymentMethod = String(body.paymentMethod ?? "").trim();
    const phone = normalizeMgPhone(String(body.phone ?? "").trim());

    if (!VALID_METHODS.includes(paymentMethod as (typeof VALID_METHODS)[number])) {
      return NextResponse.json({ error: "Mode de paiement invalide" }, { status: 400 });
    }

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
  } catch (error) {
    console.error("[POST /api/provider/subscription/purchase]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
