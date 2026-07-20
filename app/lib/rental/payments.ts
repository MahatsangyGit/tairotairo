import prisma from "@/lib/prisma";
import { withBypassRls } from "@/lib/rls";
import type { RentalTransaction } from "@/generated/prisma/client";
import { PaymentError } from "@/lib/payments";

type PaymentMethod = "ORANGE_MONEY" | "MVOLA" | "AIRTEL_MONEY";

/**
 * Capture loyer + caution sous séquestre (simulé Mobile Money).
 * Prérequis : location en ACCEPTED.
 */
export async function captureRentalToEscrow(
  rentalBookingId: string,
  paymentMethod: PaymentMethod
): Promise<RentalTransaction> {
  return withBypassRls(async () => {
    const rental = await prisma.rentalBooking.findUnique({
      where: { id: rentalBookingId },
      include: { transaction: true },
    });

    if (!rental) {
      throw new PaymentError("Location introuvable", 404);
    }
    if (rental.status !== "ACCEPTED") {
      throw new PaymentError(
        "La location doit être acceptée avant paiement",
        409
      );
    }
    if (rental.totalAmount <= 0) {
      throw new PaymentError("Montant invalide", 400);
    }

    return prisma.$transaction(async (tx) => {
      const locked = await tx.rentalBooking.updateMany({
        where: { id: rentalBookingId, status: "ACCEPTED" },
        data: { status: "PAID" },
      });
      if (locked.count !== 1) {
        throw new PaymentError(
          "La location a déjà changé d'état. Actualisez et réessayez.",
          409
        );
      }

      if (rental.transaction) {
        const existing = rental.transaction;
        if (
          existing.status === "ESCROWED" ||
          existing.status === "RELEASED"
        ) {
          throw new PaymentError("Paiement déjà effectué", 409);
        }
        return tx.rentalTransaction.update({
          where: { id: existing.id },
          data: {
            status: "ESCROWED",
            amount: rental.totalAmount,
            depositAmount: rental.depositAmount,
            paymentMethod,
            escrowedAt: new Date(),
            refundedAt: null,
            depositRefundedAt: null,
            depositRetained: 0,
          },
        });
      }

      return tx.rentalTransaction.create({
        data: {
          rentalBookingId,
          amount: rental.totalAmount,
          depositAmount: rental.depositAmount,
          paymentMethod,
          status: "ESCROWED",
          escrowedAt: new Date(),
        },
      });
    });
  });
}

/**
 * Clôture : libère le loyer vers le propriétaire + rembourse la caution
 * (moins depositRetained en litige).
 */
export async function settleRental(
  rentalBookingId: string,
  depositRetained = 0
): Promise<{ transaction: RentalTransaction; payoutId: string }> {
  return withBypassRls(async () => {
    const rental = await prisma.rentalBooking.findUnique({
      where: { id: rentalBookingId },
      include: { transaction: true },
    });

    if (!rental) {
      throw new PaymentError("Location introuvable", 404);
    }

    const transaction = rental.transaction;
    if (!transaction) {
      throw new PaymentError("Aucun paiement sous séquestre", 409);
    }
    if (transaction.status === "RELEASED") {
      return { transaction, payoutId: "" };
    }
    if (transaction.status !== "ESCROWED") {
      throw new PaymentError("Aucun paiement sous séquestre", 409);
    }

    const retained = Math.min(
      Math.max(0, depositRetained),
      transaction.depositAmount
    );
    const depositRefund = transaction.depositAmount - retained;

    const result = await prisma.$transaction(async (tx) => {
      const updatedTx = await tx.rentalTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
          depositRetained: retained,
          depositRefundedAt: depositRefund > 0 ? new Date() : null,
        },
      });

      const payout = await tx.rentalPayout.create({
        data: {
          ownerId: rental.ownerId,
          transactionId: transaction.id,
          amount: transaction.amount + retained,
          currency: transaction.currency,
          status: "PENDING",
        },
      });

      return { updatedTx, payout };
    });

    return { transaction: result.updatedTx, payoutId: result.payout.id };
  });
}

/** Annulation après séquestre : remboursement loyer + caution. */
export async function refundRental(
  rentalBookingId: string
): Promise<RentalTransaction | null> {
  return withBypassRls(async () => {
    const rental = await prisma.rentalBooking.findUnique({
      where: { id: rentalBookingId },
      include: { transaction: true },
    });

    if (!rental?.transaction) return null;
    const transaction = rental.transaction;

    if (transaction.status === "RELEASED") {
      throw new PaymentError(
        "Les fonds ont déjà été versés au propriétaire",
        409
      );
    }
    if (transaction.status === "REFUNDED") return transaction;

    if (transaction.status !== "ESCROWED") {
      return prisma.rentalTransaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });
    }

    return prisma.rentalTransaction.update({
      where: { id: transaction.id },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
        depositRefundedAt: new Date(),
        depositRetained: 0,
      },
    });
  });
}
