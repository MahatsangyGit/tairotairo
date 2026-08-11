import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveImageOptimizeMode } from "@/lib/image-optimize-queue";

describe("resolveImageOptimizeMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("honors explicit queue / inline", () => {
    vi.stubEnv("IMAGE_OPTIMIZE_MODE", "queue");
    expect(resolveImageOptimizeMode()).toBe("queue");
    vi.stubEnv("IMAGE_OPTIMIZE_MODE", "inline");
    expect(resolveImageOptimizeMode()).toBe("inline");
  });

  it("uses queue in production when REDIS_URL is set (hors Vercel)", () => {
    vi.stubEnv("IMAGE_OPTIMIZE_MODE", undefined);
    vi.stubEnv("VERCEL", undefined);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("REDIS_URL", "redis://127.0.0.1:6379");
    expect(resolveImageOptimizeMode()).toBe("queue");
  });

  it("stays inline on Vercel even with production + Redis", () => {
    vi.stubEnv("IMAGE_OPTIMIZE_MODE", undefined);
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("REDIS_URL", "redis://127.0.0.1:6379");
    expect(resolveImageOptimizeMode()).toBe("inline");
  });

  it("stays inline in development even with Redis", () => {
    vi.stubEnv("IMAGE_OPTIMIZE_MODE", undefined);
    vi.stubEnv("VERCEL", undefined);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("REDIS_URL", "redis://127.0.0.1:6379");
    expect(resolveImageOptimizeMode()).toBe("inline");
  });
});
