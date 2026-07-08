import prisma from "@/lib/prisma";
import type { Booking, Transaction } from "@/generated/prisma/client";
import { withBypassRls } from "@/lib/rls";

/**
 * Prix affiché d'une réservation : priorise le snapshot figé, sinon le prix du
 * service/demande lié. Utilisé pour le montant du paiement.
 */
export function bookingAmount(booking: {
  displayPrice?: number | null;
  service?: { price?: number | null } | null;
  requestResponse?: { proposedPrice?: number | null } | null;
}): number {
  if (typeof booking.displayPrice === "number" && booking.displayPrice > 0) {
    return booking.displayPrice;
  }
  const proposed = booking.requestResponse?.proposedPrice;
  if (typeof proposed === "number" && proposed > 0) {
    return proposed;
  }
  const servicePrice = booking.service?.price;
  if (typeof servicePrice === "number" && servicePrice > 0) {
    return servicePrice;
  }
  return 0;
}

type BookingWithTransaction = Booking & { transaction: Transaction | null };

/**
 * Capture le paiement client et place les fonds sous séquestre sur le compte
 * Tairo ampio. Le prestataire Mobile Money réel sera branché plus tard : on
 * enregistre pour l'instant la transaction en ESCROWED.
 */
export async function capturePaymentToEscrow(
  bookingId: string,
  paymentMethod: "ORANGE_MONEY" | "MVOLA" | "AIRTEL_MONEY"
): Promise<Transaction> {
  return withBypassRls(async () => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        displayPrice: true,
        service: { select: { price: true } },
        requestResponse: { select: { proposedPrice: true } },
        transaction: true,
      },
    });

    if (!booking) {
      throw new PaymentError("Réservation introuvable", 404);
    }

    if (booking.status !== "CONFIRMED") {
      throw new PaymentError(
        "La réservation doit être confirmée avant paiement",
        409
      );
    }

    const amount = bookingAmount(booking);
    if (amount <= 0) {
      throw new PaymentError("Montant invalide pour le paiement", 400);
    }

    // Une transaction existe déjà (ex: initiée mais échouée) → on la réutilise.
    if (booking.transaction) {
      const existing = booking.transaction;
      if (existing.status === "ESCROWED" || existing.status === "RELEASED") {
        throw new PaymentError("Paiement déjà effectué", 409);
      }
      return prisma.transaction.update({
        where: { id: existing.id },
        data: {
          status: "ESCROWED",
          amount,
          paymentMethod,
          escrowedAt: new Date(),
          refundedAt: null,
        },
      });
    }

    return prisma.transaction.create({
      data: {
        bookingId,
        amount,
        paymentMethod,
        status: "ESCROWED",
        escrowedAt: new Date(),
      },
    });
  });
}

/**
 * Débloque les fonds séquestrés vers le compte du prestataire. Crée un
 * ProviderPayout (statut PENDING : le versement réel Mobile Money sera traité
 * plus tard). Marque la transaction RELEASED.
 */
export async function releaseEscrowToProvider(
  bookingId: string
): Promise<{ transaction: Transaction; payoutId: string }> {
  return withBypassRls(async () => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        providerId: true,
        transaction: true,
      },
    });

    if (!booking) {
      throw new PaymentError("Réservation introuvable", 404);
    }

    if (booking.status !== "DONE_PENDING_VALIDATION") {
      throw new PaymentError(
        "La prestation doit être terminée et en attente de validation client",
        409
      );
    }

    const transaction = booking.transaction;
    if (!transaction || transaction.status !== "ESCROWED") {
      throw new PaymentError(
        "Aucun paiement sous séquestre à débloquer",
        409
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedTx = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
        },
      });

      const payout = await tx.providerPayout.create({
        data: {
          providerId: booking.providerId,
          transactionId: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          status: "PENDING",
        },
      });

      return { updatedTx, payout };
    });

    return { transaction: result.updatedTx, payoutId: result.payout.id };
  });
}

/**
 * Rembourse le client : utilisé lors d'une annulation après capture. Marque la
 * transaction REFUNDED et annule le payout prestataire éventuel.
 */
export async function refundEscrowToClient(
  bookingId: string
): Promise<Transaction | null> {
  return withBypassRls(async () => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, transaction: true },
    });

    if (!booking || !booking.transaction) return null;

    const transaction = booking.transaction;

    // Déjà libéré : on ne peut plus rembourser via ce flux.
    if (transaction.status === "RELEASED") {
      throw new PaymentError(
        "Les fonds ont déjà été versés au prestataire",
        409
      );
    }

    if (transaction.status === "REFUNDED") {
      return transaction;
    }

    if (transaction.status !== "ESCROWED") {
      // Paiement non capturé : on le marque simplement FAILED.
      return prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });
    }

    return prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
      },
    });
  });
}

export class PaymentError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "PaymentError";
  }
}

export type { BookingWithTransaction };
