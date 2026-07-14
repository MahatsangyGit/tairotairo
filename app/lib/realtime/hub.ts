import type { WebSocket } from "ws";
import type Redis from "ioredis";
import type { RealtimeServerEvent } from "@/lib/realtime/types";
import { getRedisClient, REALTIME_REDIS_CHANNEL } from "@/lib/redis";

type ClientSocket = WebSocket & { isAlive?: boolean };

class MessagingHub {
  private readonly socketsByUser = new Map<string, Set<ClientSocket>>();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private redisSubscribed = false;
  private redisSubscriber: Redis | null = null;

  addSocket(userId: string, socket: ClientSocket) {
    const set = this.socketsByUser.get(userId) ?? new Set();
    set.add(socket);
    this.socketsByUser.set(userId, set);
  }

  removeSocket(userId: string, socket: ClientSocket) {
    const set = this.socketsByUser.get(userId);
    if (!set) return;
    set.delete(socket);
    if (set.size === 0) {
      this.socketsByUser.delete(userId);
    }
  }

  private deliverLocal(userIds: string[], event: RealtimeServerEvent) {
    const payload = JSON.stringify(event);
    const delivered = new Set<ClientSocket>();

    for (const userId of userIds) {
      const sockets = this.socketsByUser.get(userId);
      if (!sockets) continue;

      for (const socket of sockets) {
        if (delivered.has(socket)) continue;
        if (socket.readyState !== socket.OPEN) continue;

        socket.send(payload);
        delivered.add(socket);
      }
    }
  }

  publishToUsers(userIds: string[], event: RealtimeServerEvent) {
    this.deliverLocal(userIds, event);

    const redis = getRedisClient();
    if (!redis) return;

    void redis
      .publish(
        REALTIME_REDIS_CHANNEL,
        JSON.stringify({ userIds, event })
      )
      .catch(() => {
        // fallback local only
      });
  }

  startHeartbeat() {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      for (const sockets of this.socketsByUser.values()) {
        for (const socket of sockets) {
          if (socket.isAlive === false) {
            socket.terminate();
            continue;
          }
          socket.isAlive = false;
          socket.ping();
        }
      }
    }, 30_000);

    this.heartbeatInterval.unref?.();
    void this.subscribeRedis();
  }

  private async subscribeRedis() {
    if (this.redisSubscribed || this.redisSubscriber) return;
    const redis = getRedisClient();
    if (!redis) return;

    try {
      const subscriber = redis.duplicate();
      this.redisSubscriber = subscriber;
      await subscriber.subscribe(REALTIME_REDIS_CHANNEL);
      subscriber.on("message", (_channel, message) => {
        try {
          const parsed = JSON.parse(message) as {
            userIds: string[];
            event: RealtimeServerEvent;
          };
          if (parsed?.userIds && parsed.event) {
            this.deliverLocal(parsed.userIds, parsed.event);
          }
        } catch {
          // ignore malformed
        }
      });
      this.redisSubscribed = true;
    } catch {
      // single-instance mode — drop half-open duplicate if subscribe failed
      const failed = this.redisSubscriber;
      this.redisSubscriber = null;
      this.redisSubscribed = false;
      if (failed) {
        void failed.quit().catch(() => undefined);
      }
    }
  }

  async shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    for (const sockets of this.socketsByUser.values()) {
      for (const socket of sockets) {
        socket.terminate();
      }
    }
    this.socketsByUser.clear();

    const subscriber = this.redisSubscriber;
    this.redisSubscriber = null;
    this.redisSubscribed = false;
    if (subscriber) {
      try {
        await subscriber.unsubscribe(REALTIME_REDIS_CHANNEL);
      } catch {
        // ignore unsubscribe errors during shutdown
      }
      try {
        await subscriber.quit();
      } catch {
        subscriber.disconnect();
      }
    }
  }
}

const globalForHub = globalThis as unknown as {
  messagingHub?: MessagingHub;
};

export function getMessagingHub(): MessagingHub {
  if (!globalForHub.messagingHub) {
    globalForHub.messagingHub = new MessagingHub();
    globalForHub.messagingHub.startHeartbeat();
  }
  return globalForHub.messagingHub;
}
