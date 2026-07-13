import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withApiHandler } from "@/lib/api-handler";

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

    if (!redisOk) {
      return NextResponse.json(
        { status: "degraded", database: "ok", redis: "error" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      database: "ok",
      redis: process.env.REDIS_URL ? "ok" : "skipped",
    });
  } catch {
    return NextResponse.json(
      { status: "error", database: "error" },
      { status: 503 }
    );
  }
});
