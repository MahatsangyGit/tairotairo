import type { Prisma } from "@/generated/prisma/client";

/** Public reviews require a booking paid via the app (escrowed or released). */
export const PAID_REVIEW_TRANSACTION_STATUSES = [
  "ESCROWED",
  "RELEASED",
] as const;

export type PaidReviewTransactionStatus =
  (typeof PAID_REVIEW_TRANSACTION_STATUSES)[number];

export function paidReviewWhere(
  targetId: string
): Prisma.ReviewWhereInput {
  return {
    targetId,
    booking: {
      is: {
        transaction: {
          is: { status: { in: [...PAID_REVIEW_TRANSACTION_STATUSES] } },
        },
      },
    },
  };
}
