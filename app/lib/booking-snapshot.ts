import prisma from "@/lib/prisma";
import { snapshotFromRequest } from "@/lib/booking-display";

/** Enregistre les infos d’affichage avant suppression de la demande (cascade sur les propositions). */
export async function snapshotBookingsForRequest(requestId: string) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      title: true,
      budget: true,
      category: true,
      location: true,
      responses: {
        select: {
          proposedPrice: true,
          booking: {
            select: {
              id: true,
              displayTitle: true,
            },
          },
        },
      },
    },
  });

  if (!request) return;

  const snapshot = (proposedPrice: number | null) =>
    snapshotFromRequest(request, proposedPrice);

  await Promise.all(
    request.responses
      .filter((r) => r.booking && !r.booking.displayTitle)
      .map((r) =>
        prisma.booking.update({
          where: { id: r.booking!.id },
          data: snapshot(r.proposedPrice),
        })
      )
  );
}
