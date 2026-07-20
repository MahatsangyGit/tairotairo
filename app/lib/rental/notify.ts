import prisma from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";
import { NOTIFICATION_TYPES } from "@/lib/notification-types";
import { absoluteVerticalUrl } from "@/lib/origins";
import { withBypassRls } from "@/lib/rls";

async function loadRental(rentalId: string) {
  return withBypassRls(() =>
    prisma.rentalBooking.findUnique({
      where: { id: rentalId },
      select: {
        id: true,
        displayTitle: true,
        renterId: true,
        ownerId: true,
        equipment: { select: { title: true } },
      },
    })
  );
}

function titleOf(rental: {
  displayTitle: string | null;
  equipment: { title: string } | null;
}) {
  return rental.displayTitle || rental.equipment?.title || "Matériel";
}

function link(rentalId: string) {
  return absoluteVerticalUrl("rental", `/mes-locations/${rentalId}`);
}

export async function notifyEquipmentApproved(equipmentId: string, ownerId: string) {
  await dispatchNotification({
    userId: ownerId,
    type: NOTIFICATION_TYPES.EQUIPMENT_APPROVED,
    title: "Matériel approuvé",
    body: "Votre annonce de matériel est maintenant publiée sur Tairo ampindramo.",
    link: absoluteVerticalUrl("rental", `/materiel/${equipmentId}`),
  });
}

export async function notifyEquipmentRejected(
  equipmentId: string,
  ownerId: string,
  reason?: string | null
) {
  await dispatchNotification({
    userId: ownerId,
    type: NOTIFICATION_TYPES.EQUIPMENT_REJECTED,
    title: "Matériel refusé",
    body: reason?.trim()
      ? `Votre annonce a été refusée : ${reason.trim()}`
      : "Votre annonce de matériel a été refusée par la modération.",
    link: absoluteVerticalUrl("rental", `/materiel/${equipmentId}`),
  });
}

export async function notifyRentalRequested(rentalId: string) {
  const rental = await loadRental(rentalId);
  if (!rental) return;
  await dispatchNotification({
    userId: rental.ownerId,
    type: NOTIFICATION_TYPES.RENTAL_REQUESTED,
    title: "Nouvelle demande de location",
    body: `Une demande pour « ${titleOf(rental)} » attend votre réponse.`,
    link: link(rentalId),
  });
}

export async function notifyRentalAccepted(rentalId: string) {
  const rental = await loadRental(rentalId);
  if (!rental) return;
  await dispatchNotification({
    userId: rental.renterId,
    type: NOTIFICATION_TYPES.RENTAL_ACCEPTED,
    title: "Location acceptée",
    body: `Votre demande pour « ${titleOf(rental)} » a été acceptée. Procédez au paiement.`,
    link: link(rentalId),
  });
}

export async function notifyRentalPaid(rentalId: string) {
  const rental = await loadRental(rentalId);
  if (!rental) return;
  await dispatchNotification({
    userId: rental.ownerId,
    type: NOTIFICATION_TYPES.RENTAL_PAID,
    title: "Location payée",
    body: `Le paiement pour « ${titleOf(rental)} » est sous séquestre.`,
    link: link(rentalId),
  });
}

export async function notifyRentalReturnRequested(rentalId: string) {
  const rental = await loadRental(rentalId);
  if (!rental) return;
  await dispatchNotification({
    userId: rental.ownerId,
    type: NOTIFICATION_TYPES.RENTAL_RETURN_REQUESTED,
    title: "Retour du matériel",
    body: `Le retour de « ${titleOf(rental)} » est en attente de validation.`,
    link: link(rentalId),
  });
}

export async function notifyRentalCompleted(rentalId: string) {
  const rental = await loadRental(rentalId);
  if (!rental) return;
  await dispatchNotification({
    userId: rental.renterId,
    type: NOTIFICATION_TYPES.RENTAL_COMPLETED,
    title: "Location terminée",
    body: `La location de « ${titleOf(rental)} » est clôturée.`,
    link: link(rentalId),
  });
  await dispatchNotification({
    userId: rental.ownerId,
    type: NOTIFICATION_TYPES.RENTAL_COMPLETED,
    title: "Location terminée",
    body: `La location de « ${titleOf(rental)} » est clôturée. Le loyer sera versé.`,
    link: link(rentalId),
  });
}

export async function notifyRentalDisputed(rentalId: string) {
  const rental = await loadRental(rentalId);
  if (!rental) return;
  for (const userId of [rental.renterId, rental.ownerId]) {
    await dispatchNotification({
      userId,
      type: NOTIFICATION_TYPES.RENTAL_DISPUTED,
      title: "Litige sur une location",
      body: `Un litige a été ouvert pour « ${titleOf(rental)} ».`,
      link: link(rentalId),
    });
  }
}
