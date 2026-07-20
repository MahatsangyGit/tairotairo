import { afterEach, describe, expect, it } from "vitest";
import { resolveImageOptimizeMode } from "@/lib/image-optimize-queue";

describe("resolveImageOptimizeMode", () => {
  const prev = {
    mode: process.env.IMAGE_OPTIMIZE_MODE,
    nodeEnv: process.env.NODE_ENV,
    redis: process.env.REDIS_URL,
  };

  afterEach(() => {
    if (prev.mode === undefined) delete process.env.IMAGE_OPTIMIZE_MODE;
    else process.env.IMAGE_OPTIMIZE_MODE = prev.mode;
    if (prev.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prev.nodeEnv;
    if (prev.redis === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = prev.redis;
  });

  it("honors explicit queue / inline", () => {
    process.env.IMAGE_OPTIMIZE_MODE = "queue";
    expect(resolveImageOptimizeMode()).toBe("queue");
    process.env.IMAGE_OPTIMIZE_MODE = "inline";
    expect(resolveImageOptimizeMode()).toBe("inline");
  });

  it("uses queue in production when REDIS_URL is set", () => {
    delete process.env.IMAGE_OPTIMIZE_MODE;
    process.env.NODE_ENV = "production";
    process.env.REDIS_URL = "redis://127.0.0.1:6379";
    expect(resolveImageOptimizeMode()).toBe("queue");
  });

  it("stays inline in development even with Redis", () => {
    delete process.env.IMAGE_OPTIMIZE_MODE;
    process.env.NODE_ENV = "development";
    process.env.REDIS_URL = "redis://127.0.0.1:6379";
    expect(resolveImageOptimizeMode()).toBe("inline");
  });
});
