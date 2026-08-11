import { afterEach, describe, expect, it, vi } from "vitest";

describe("isMessagingWebSocketEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("désactive le WS quand NEXT_PUBLIC_VERCEL_ENV est défini", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_MESSAGING_WS_ENABLED", undefined);
    const { isMessagingWebSocketEnabled } = await import("@/lib/realtime/client");
    expect(isMessagingWebSocketEnabled()).toBe(false);
  });

  it("active le WS en local (pas de Vercel env)", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", undefined);
    vi.stubEnv("NEXT_PUBLIC_MESSAGING_WS_ENABLED", undefined);
    const { isMessagingWebSocketEnabled } = await import("@/lib/realtime/client");
    expect(isMessagingWebSocketEnabled()).toBe(true);
  });

  it("respecte NEXT_PUBLIC_MESSAGING_WS_ENABLED=1 même sur Vercel", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_MESSAGING_WS_ENABLED", "1");
    const { isMessagingWebSocketEnabled } = await import("@/lib/realtime/client");
    expect(isMessagingWebSocketEnabled()).toBe(true);
  });

  it("respecte NEXT_PUBLIC_MESSAGING_WS_ENABLED=0 en local", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", undefined);
    vi.stubEnv("NEXT_PUBLIC_MESSAGING_WS_ENABLED", "0");
    const { isMessagingWebSocketEnabled } = await import("@/lib/realtime/client");
    expect(isMessagingWebSocketEnabled()).toBe(false);
  });
});
