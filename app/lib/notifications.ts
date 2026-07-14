import prisma from "@/lib/prisma";
import { withBypassRls } from "@/lib/rls";
import { BRAND_PRIMARY, SITE_NAME } from "@/lib/site";
import { APP_URL, sendEmail, emailLayout } from "@/lib/email";
import { publishNotificationCreated } from "@/lib/realtime/publish";
import { escapeHtml } from "@/lib/html-escape";
import {
  sendsNotificationEmail,
  type NotificationType,
} from "@/lib/notification-types";

export interface DispatchNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}

/** Only allow relative app paths for notification deep links. */
function safeInternalLink(link: string | undefined): string | null {
  if (!link) return null;
  if (!link.startsWith("/") || link.startsWith("//")) return null;
  try {
    const url = new URL(link, APP_URL);
    if (url.origin !== new URL(APP_URL).origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export async function sendNotificationEmail(
  to: string,
  name: string,
  title: string,
  body: string,
  link?: string | null
) {
  const safeLink = safeInternalLink(link ?? undefined);
  const fullLink = safeLink ? `${APP_URL}${safeLink}` : null;
  const safeName = escapeHtml(name);
  const safeBody = escapeHtml(body);
  const safeFullLink = fullLink ? escapeHtml(fullLink) : null;

  return sendEmail({
    to,
    subject: `${title} — ${SITE_NAME}`,
    html: emailLayout(
      title,
      `
        <p>Bonjour ${safeName},</p>
        <p>${safeBody}</p>
        ${
          safeFullLink
            ? `<p><a href="${safeFullLink}" style="color:${BRAND_PRIMARY}">Voir les détails →</a></p>`
            : ""
        }
      `
    ),
    text: `${title}\n\n${body}${fullLink ? `\n\n${fullLink}` : ""}`,
  });
}

export async function dispatchNotification(
  input: DispatchNotificationInput
): Promise<void> {
  return withBypassRls(async () => {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        name: true,
        email: true,
        notifyEmail: true,
        notifyPush: true,
      },
    });

    if (!user) return;

    await prisma.$transaction(async (tx) => {
      const notification = await tx.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          link: input.link ?? null,
        },
      });

      const outboxRows: {
        notificationId: string;
        userId: string;
        channel: "EMAIL" | "PUSH";
      }[] = [];

      if (user.notifyEmail && sendsNotificationEmail(input.type)) {
        outboxRows.push({
          notificationId: notification.id,
          userId: input.userId,
          channel: "EMAIL",
        });
      }

      if (user.notifyPush) {
        outboxRows.push({
          notificationId: notification.id,
          userId: input.userId,
          channel: "PUSH",
        });
      }

      if (outboxRows.length > 0) {
        for (const row of outboxRows) {
          await tx.notificationOutbox.create({ data: row });
        }
      }
    });

    publishNotificationCreated(input.userId);
  });
}

export async function dispatchNotificationToMany(
  userIds: string[],
  input: Omit<DispatchNotificationInput, "userId">
) {
  const unique = [...new Set(userIds)];
  await Promise.all(
    unique.map((userId) =>
      dispatchNotification({
        userId,
        ...input,
      })
    )
  );
}
