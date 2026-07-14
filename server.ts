import { createServer, type Server } from "http";
import { parse } from "url";
import next from "next";
import "dotenv/config";

/** Marks that the process was started via the custom Node server (audit C6). */
process.env.TAIRO_CUSTOM_SERVER = "1";

import { validateDatabaseUrl } from "./app/lib/database-url";
import { validateJwtSecret } from "./app/lib/jwt-secret";
import { disconnectPrisma } from "./app/lib/prisma";
import { validateEnvAtBoot } from "./app/lib/env";
import { disconnectRedis } from "./app/lib/redis";

try {
  validateDatabaseUrl();
  validateJwtSecret();
  validateEnvAtBoot();
} catch (error) {
  console.error("[Tairo ampio] Configuration invalide :");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let httpServer: Server | null = null;
let closeMessagingWs: (() => Promise<void>) | null = null;
let shuttingDown = false;

async function gracefulShutdown(signal: string, exitCode = 0): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  console.error(`[Tairo ampio] Arrêt (${signal})…`);

  const forceExit = setTimeout(() => {
    console.error("[Tairo ampio] Arrêt forcé après délai");
    process.exit(1);
  }, 10_000);
  forceExit.unref?.();

  try {
    if (httpServer) {
      await new Promise<void>((resolve, reject) => {
        httpServer!.close((err) => (err ? reject(err) : resolve()));
      });
    }

    if (closeMessagingWs) {
      await closeMessagingWs();
    }

    await disconnectPrisma();
    await disconnectRedis();
    clearTimeout(forceExit);
    process.exit(exitCode);
  } catch (error) {
    console.error("[Tairo ampio] Erreur pendant l'arrêt :", error);
    process.exit(1);
  }
}

process.on("uncaughtException", (error) => {
  console.error("[Tairo ampio] uncaughtException:", error);
  void gracefulShutdown("uncaughtException", 1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[Tairo ampio] unhandledRejection:", reason);
  void gracefulShutdown("unhandledRejection", 1);
});

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

app
  .prepare()
  .then(async () => {
    const { attachMessagingWebSocket } = await import(
      "./app/lib/realtime/ws-server"
    );
    const { resolveRlsContextFromRequest, runWithRls } = await import(
      "./app/lib/rls"
    );
    const {
      csrfRejectedResponse,
      payloadTooLargeResponse,
      rejectInvalidCsrf,
      rejectOversizedApiBody,
    } = await import("./app/lib/http-security");
    const {
      attachCorsHeadersOnResponse,
      resolveCorsForNodeRequest,
      writeCorsOnlyResponse,
    } = await import("./app/lib/cors");

    const server = createServer(async (req, res) => {
      const parsedUrl = parse(req.url!, true);
      const pathname = parsedUrl.pathname ?? "";

      if (pathname.startsWith("/api")) {
        const cors = resolveCorsForNodeRequest(req);

        if (cors.action === "preflight") {
          writeCorsOnlyResponse(res, cors.status, cors.headers);
          return;
        }

        if (cors.action === "forbidden") {
          writeCorsOnlyResponse(res, cors.status, {});
          return;
        }

        if (cors.action === "continue") {
          attachCorsHeadersOnResponse(res, cors.headers);
        }
      }

      if (rejectOversizedApiBody(req.method, req.url, req.headers)) {
        payloadTooLargeResponse(res);
        return;
      }

      if (rejectInvalidCsrf(req.method, req.url, req.headers)) {
        csrfRejectedResponse(res);
        return;
      }

      const { createRequestId, runWithRequestContext } = await import(
        "./app/lib/request-context"
      );
      const { logger } = await import("./app/lib/logger");
      const requestId = createRequestId(
        typeof req.headers["x-request-id"] === "string"
          ? req.headers["x-request-id"]
          : Array.isArray(req.headers["x-request-id"])
            ? req.headers["x-request-id"][0]
            : null
      );
      res.setHeader("x-request-id", requestId);
      const startedAt = Date.now();

      const rlsContext = await resolveRlsContextFromRequest(
        req.url ?? undefined,
        req.headers.cookie
      );

      void runWithRequestContext({ requestId }, async () => {
        await runWithRls(rlsContext, async () => {
          await handle(req, res, parsedUrl);
        });
      })
        .catch((error) => {
          console.error("[Tairo ampio] Erreur requête HTTP :", error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.end("Internal Server Error");
          }
        })
        .finally(() => {
          if (pathname.startsWith("/api")) {
            logger.info(
              {
                requestId,
                method: req.method,
                path: pathname,
                status: res.statusCode,
                durationMs: Date.now() - startedAt,
              },
              "api.access"
            );
          }
        });
    });

    httpServer = server;

    const messagingWs = attachMessagingWebSocket(server, app.getUpgradeHandler());
    closeMessagingWs = messagingWs.close;

    server.on("error", (error: NodeJS.ErrnoException) => {
      console.error("[Tairo ampio] Erreur serveur HTTP :", error);
      if (error.code === "EADDRINUSE") {
        process.exit(1);
      }
    });

    server.listen(port, () => {
      console.log(`> Tairo ampio prêt sur http://${hostname}:${port}`);
      console.log(`> WebSocket messagerie : ws://${hostname}:${port}/ws/messaging`);
    });
  })
  .catch((error) => {
    console.error("[Tairo ampio] Échec du démarrage :", error);
    process.exit(1);
  });
