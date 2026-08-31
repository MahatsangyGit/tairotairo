import prisma from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";
import { NOTIFICATION_TYPES } from "@/lib/notification-types";

export async function notifyNewRequestResponse(
  requestId: string,
  providerName: string
) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { id: true, title: true, clientId: true },
  });

  if (!request) return;

  await dispatchNotification({
    userId: request.clientId,
    type: NOTIFICATION_TYPES.REQUEST_NEW_RESPONSE,
    title: "Nouvelle proposition",
    body: `${providerName} a répondu à votre demande « ${request.title} ».`,
    link: `/dashboard/client/requests/${request.id}`,
  });
}

export async function notifyRequestResponseAccepted(
  requestId: string,
  providerId: string,
  requestTitle: string
) {
  await dispatchNotification({
    userId: providerId,
    type: NOTIFICATION_TYPES.REQUEST_RESPONSE_ACCEPTED,
    title: "Proposition acceptée",
    body: `Votre proposition pour « ${requestTitle} » a été acceptée. Une réservation a été créée.`,
    link: "/dashboard/provider",
  });
}
