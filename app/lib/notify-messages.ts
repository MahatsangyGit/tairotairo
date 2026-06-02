import { dispatchNotification } from "@/lib/notifications";
import { NOTIFICATION_TYPES } from "@/lib/notification-types";

/** Notifie le destinataire d'un nouveau message in-app (seul cas avec email). */
export async function notifyMessageReceived(params: {
  recipientId: string;
  senderName: string;
  preview: string;
  conversationLink: string;
}) {
  const preview =
    params.preview.length > 120
      ? `${params.preview.slice(0, 117)}...`
      : params.preview;

  await dispatchNotification({
    userId: params.recipientId,
    type: NOTIFICATION_TYPES.MESSAGE_RECEIVED,
    title: `Nouveau message de ${params.senderName}`,
    body: preview,
    link: params.conversationLink,
  });
}
