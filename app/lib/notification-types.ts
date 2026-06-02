export const NOTIFICATION_TYPES = {
  BOOKING_CREATED: "BOOKING_CREATED",
  BOOKING_CONFIRMED: "BOOKING_CONFIRMED",
  BOOKING_COMPLETED: "BOOKING_COMPLETED",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
  REQUEST_NEW_RESPONSE: "REQUEST_NEW_RESPONSE",
  REQUEST_RESPONSE_ACCEPTED: "REQUEST_RESPONSE_ACCEPTED",
  /** Réception d'un message in-app — seul type déclenchant un email */
  MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

const EMAIL_NOTIFICATION_TYPES = new Set<NotificationType>([
  NOTIFICATION_TYPES.MESSAGE_RECEIVED,
]);

export function sendsNotificationEmail(type: NotificationType): boolean {
  return EMAIL_NOTIFICATION_TYPES.has(type);
}
