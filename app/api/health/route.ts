import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withApiHandler } from "@/lib/api-handler";
import {
  isImageWorkerHealthy,
  resolveImageOptimizeMode,
} from "@/lib/image-optimize-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function checkRedis(): Promise<boolean> {
  const url = process.env.REDIS_URL;
  if (!url) return true;

  try {
    const { getRedisClient } = await import("@/lib/redis");
    const client = getRedisClient();
    if (!client) return false;
    const pong = await client.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}

export const GET = withApiHandler("GET /api/health", async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisOk = await checkRedis();
    const imageMode = resolveImageOptimizeMode();
    const imageWorker = await isImageWorkerHealthy();

    if (!redisOk) {
      return NextResponse.json(
        {
          status: "degraded",
          database: "ok",
          redis: "error",
          imageOptimize: imageMode,
          imageWorker:
            imageWorker === null ? "n/a" : imageWorker ? "ok" : "error",
        },
        { status: 503 }
      );
    }

    if (imageMode === "queue" && imageWorker === false) {
      return NextResponse.json(
        {
          status: "degraded",
          database: "ok",
          redis: process.env.REDIS_URL ? "ok" : "skipped",
          imageOptimize: imageMode,
          imageWorker: "error",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      database: "ok",
      redis: process.env.REDIS_URL ? "ok" : "skipped",
      imageOptimize: imageMode,
      imageWorker:
        imageWorker === null ? "n/a" : imageWorker ? "ok" : "error",
    });
  } catch {
    return NextResponse.json(
      { status: "error", database: "error" },
      { status: 503 }
    );
  }
});
