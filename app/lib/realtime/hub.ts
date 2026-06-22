import type { WebSocket } from "ws";
import type { RealtimeServerEvent } from "@/lib/realtime/types";

type ClientSocket = WebSocket & { isAlive?: boolean };

class MessagingHub {
  private readonly socketsByUser = new Map<string, Set<ClientSocket>>();

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

  publishToUsers(userIds: string[], event: RealtimeServerEvent) {
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

  startHeartbeat() {
    const interval = setInterval(() => {
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

    interval.unref?.();
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
