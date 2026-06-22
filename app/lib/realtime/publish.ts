import { getMessagingHub } from "@/lib/realtime/hub";
import type { ConversationParticipants } from "@/lib/realtime/types";
import { toWireMessage } from "@/lib/realtime/wire-message";

type MessageWithSender = Parameters<typeof toWireMessage>[0];

function participantUserIds(participants: ConversationParticipants): string[] {
  return [participants.clientId, participants.providerId];
}

export function publishMessageCreated(
  participants: ConversationParticipants,
  conversationId: string,
  message: MessageWithSender
) {
  const hub = getMessagingHub();
  const userIds = participantUserIds(participants);

  hub.publishToUsers(userIds, {
    type: "message.created",
    conversationId,
    message: toWireMessage(message),
  });
  hub.publishToUsers(userIds, { type: "inbox.changed" });
}

export function publishThreadRefresh(
  participants: ConversationParticipants,
  conversationId: string
) {
  const hub = getMessagingHub();
  const userIds = participantUserIds(participants);

  hub.publishToUsers(userIds, {
    type: "thread.refresh",
    conversationId,
  });
  hub.publishToUsers(userIds, { type: "inbox.changed" });
}

export function publishInboxChanged(userId: string) {
  getMessagingHub().publishToUsers([userId], { type: "inbox.changed" });
}
