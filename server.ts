import { createServer } from "http";
import { parse } from "url";
import next from "next";
import "dotenv/config";
import { validateDatabaseUrl } from "./app/lib/database-url";
import { validateJwtSecret } from "./app/lib/jwt-secret";

try {
  validateDatabaseUrl();
  validateJwtSecret();
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

app.prepare().then(async () => {
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

  const server = createServer((req, res) => {
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
    const rlsContext = resolveRlsContextFromRequest(
      req.url ?? undefined,
      req.headers.cookie
    );

    void runWithRls(rlsContext, async () => {
      await handle(req, res, parsedUrl);
    });
  });

  attachMessagingWebSocket(server, app.getUpgradeHandler());

  server.listen(port, () => {
    console.log(`> Tairo ampio prêt sur http://${hostname}:${port}`);
    console.log(`> WebSocket messagerie : ws://${hostname}:${port}/ws/messaging`);
  });
});
