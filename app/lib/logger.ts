import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        },
      }),
});

export function logRouteError(route: string, error: unknown): void {
  if (error instanceof Error) {
    logger.error({ err: error, route }, error.message);
  } else {
    logger.error({ route, error }, "Unknown error");
  }
}
