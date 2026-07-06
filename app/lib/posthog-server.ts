import { PostHog } from "posthog-node";
import { POSTHOG_API_HOST, POSTHOG_KEY } from "@/lib/posthog";

let client: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  if (!POSTHOG_KEY) return null;

  if (!client) {
    client = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_API_HOST,
      flushAt: process.env.NODE_ENV === "production" ? 20 : 1,
      flushInterval: process.env.NODE_ENV === "production" ? 10_000 : 0,
    });
  }

  return client;
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const posthog = getPostHogServer();
  if (!posthog) return;

  posthog.capture({ distinctId, event, properties });
  await posthog.flush();
}

export async function identifyServerUser(
  distinctId: string,
  properties: Record<string, unknown>
): Promise<void> {
  const posthog = getPostHogServer();
  if (!posthog) return;

  posthog.identify({ distinctId, properties });
  await posthog.flush();
}
