import { dispatchNotification } from "@/lib/notifications";
import { NOTIFICATION_TYPES } from "@/lib/notification-types";

const PROFILE_LINK = "/dashboard/provider/profile";

export async function notifyKycPending(providerId: string) {
  await dispatchNotification({
    userId: providerId,
    type: NOTIFICATION_TYPES.KYC_PENDING,
    title: "Vérification d'identité en cours",
    body: "Votre dossier CIN a bien été reçu. Notre équipe va l'examiner sous peu. Vous serez notifié dès qu'une décision sera prise.",
    link: PROFILE_LINK,
  });
}

export async function notifyKycApproved(providerId: string) {
  await dispatchNotification({
    userId: providerId,
    type: NOTIFICATION_TYPES.KYC_APPROVED,
    title: "Identité vérifiée",
    body: "Félicitations ! Votre identité est approuvée. Vous pouvez publier des annonces, répondre aux demandes et bénéficier de la mise en avant si vous êtes abonné.",
    link: PROFILE_LINK,
  });
}

export async function notifyKycRejected(providerId: string) {
  await dispatchNotification({
    userId: providerId,
    type: NOTIFICATION_TYPES.KYC_REJECTED,
    title: "Vérification d'identité refusée",
    body: "Votre dossier KYC n'a pas pu être validé. Vérifiez vos documents CIN et soumettez à nouveau votre dossier depuis votre profil.",
    link: PROFILE_LINK,
  });
}
