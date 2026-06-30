import type { Duplex } from "stream";
import type { Server as HttpServer, IncomingMessage } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { getMessagingHub } from "@/lib/realtime/hub";
import type { RealtimeClientEvent } from "@/lib/realtime/types";

const WS_PATH = "/ws/messaging";

type ClientSocket = WebSocket & { isAlive?: boolean; userId?: string };

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};

  return Object.fromEntries(
    header.split(";").map((part) => {
      const trimmed = part.trim();
      const eq = trimmed.indexOf("=");
      if (eq === -1) return [trimmed, ""];
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      try {
        return [key, decodeURIComponent(value)];
      } catch {
        return [key, value];
      }
    })
  );
}

function getTokenFromRequest(request: IncomingMessage): string | null {
  const cookies = parseCookies(request.headers.cookie);
  return cookies.token ?? null;
}

async function verifyWsAuth(token: string) {
  const auth = verifyToken(token);
  if (!auth) return null;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { suspendedAt: true, tokenVersion: true },
  });

  if (
    !user ||
    user.suspendedAt ||
    user.tokenVersion !== auth.tokenVersion
  ) {
    return null;
  }

  return auth;
}

function safeParseClientEvent(raw: string): RealtimeClientEvent | null {
  try {
    const data = JSON.parse(raw) as RealtimeClientEvent;
    if (!data || typeof data !== "object" || !("type" in data)) return null;
    return data;
  } catch {
    return null;
  }
}

export function attachMessagingWebSocket(
  server: HttpServer,
  nextUpgradeHandler?: (
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer
  ) => void | Promise<void>
) {
  const wss = new WebSocketServer({ noServer: true });
  const hub = getMessagingHub();

  server.on("upgrade", (request, socket, head) => {
    const pathname = (() => {
      try {
        return new URL(request.url ?? "", `http://${request.headers.host}`)
          .pathname;
      } catch {
        return "";
      }
    })();

    if (pathname !== WS_PATH) {
      if (nextUpgradeHandler) {
        void nextUpgradeHandler(request, socket, head);
        return;
      }
      socket.destroy();
      return;
    }

    const token = getTokenFromRequest(request);
    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    void verifyWsAuth(token).then((auth) => {
      if (!auth) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        const client = ws as ClientSocket;
        client.userId = auth.userId;
        client.isAlive = true;
        wss.emit("connection", client, request);
      });
    });
  });

  wss.on("connection", (ws: ClientSocket) => {
    const userId = ws.userId;
    if (!userId) {
      ws.close(1008, "Non autorisé");
      return;
    }

    hub.addSocket(userId, ws);
    ws.send(JSON.stringify({ type: "connected" } satisfies { type: "connected" }));

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (raw) => {
      const text = typeof raw === "string" ? raw : raw.toString("utf8");
      const event = safeParseClientEvent(text);
      if (!event) return;

      if (event.type === "ping") {
        ws.send(JSON.stringify({ type: "connected" }));
      }
    });

    ws.on("close", () => {
      hub.removeSocket(userId, ws);
    });

    ws.on("error", () => {
      hub.removeSocket(userId, ws);
    });
  });

  return wss;
}

export const MESSAGING_WS_PATH = WS_PATH;
