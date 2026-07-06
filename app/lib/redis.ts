import Redis from "ioredis";

let client: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (client) return client;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  client = new Redis(url, {
    maxRetriesPerRequest: 2,
    lazyConnect: true,
  });

  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (!client) return;
  await client.quit();
  client = null;
}

export const REALTIME_REDIS_CHANNEL = "tairo:realtime";
