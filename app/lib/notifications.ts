import prisma from "@/lib/prisma";
import { BRAND_PRIMARY, SITE_NAME } from "@/lib/site";
import { APP_URL, sendEmail, emailLayout } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
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

async function sendNotificationEmail(
  to: string,
  name: string,
  title: string,
  body: string,
  link?: string
) {
  const fullLink = link?.startsWith("http") ? link : `${APP_URL}${link ?? ""}`;

  return sendEmail({
    to,
    subject: `${title} — ${SITE_NAME}`,
    html: emailLayout(
      title,
      `
        <p>Bonjour ${name},</p>
        <p>${body}</p>
        ${
          link
            ? `<p><a href="${fullLink}" style="color:${BRAND_PRIMARY}">Voir les détails →</a></p>`
            : ""
        }
      `
    ),
    text: `${title}\n\n${body}${link ? `\n\n${fullLink}` : ""}`,
  });
}

export async function dispatchNotification(
  input: DispatchNotificationInput
): Promise<void> {
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

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    },
  });

  const tasks: Promise<unknown>[] = [];

  if (user.notifyEmail && sendsNotificationEmail(input.type)) {
    tasks.push(
      sendNotificationEmail(
        user.email,
        user.name,
        input.title,
        input.body,
        input.link
      )
    );
  }

  if (user.notifyPush) {
    tasks.push(
      sendPushToUser(input.userId, {
        title: input.title,
        body: input.body,
        url: input.link,
      })
    );
  }

  await Promise.allSettled(tasks);
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
