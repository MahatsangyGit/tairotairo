import { afterEach, describe, expect, it, vi } from "vitest";
import { getAssetPrefix, isCdnEnabled } from "@/lib/cdn";

const ENV_KEYS = [
  "NODE_ENV",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "NEXT_PUBLIC_CDN_URL",
  "NEXT_PUBLIC_APP_URL",
] as const;

function setEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
  for (const key of ENV_KEYS) vi.stubEnv(key, undefined);
  for (const [key, value] of Object.entries(values)) {
    vi.stubEnv(key, value);
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isCdnEnabled / getAssetPrefix", () => {
  it("désactive le CDN hors production", () => {
    setEnv({
      NODE_ENV: "development",
      NEXT_PUBLIC_CDN_URL: "https://cdn.tairotairo.mg",
      NEXT_PUBLIC_APP_URL: "https://tairotairo.mg",
    });
    expect(isCdnEnabled()).toBe(false);
    expect(getAssetPrefix()).toBeUndefined();
  });

  it("désactive le CDN quand APP_URL est localhost", () => {
    setEnv({
      NODE_ENV: "production",
      VERCEL: "1",
      VERCEL_ENV: "production",
      NEXT_PUBLIC_CDN_URL: "https://cdn.tairotairo.mg",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
    expect(isCdnEnabled()).toBe(false);
    expect(getAssetPrefix()).toBeUndefined();
  });

  it("désactive le CDN quand APP_URL est un hôte *.vercel.app", () => {
    setEnv({
      NODE_ENV: "production",
      VERCEL: "1",
      VERCEL_ENV: "production",
      // VERCEL_URL est toujours *.vercel.app, même avec un domaine custom :
      // il ne doit PAS empêcher le CDN à lui seul.
      VERCEL_URL: "tairotairo-staging-abc.vercel.app",
      NEXT_PUBLIC_CDN_URL: "https://cdn.tairotairo.mg",
      NEXT_PUBLIC_APP_URL: "https://tairotairo-staging.vercel.app",
    });
    expect(isCdnEnabled()).toBe(false);
    expect(getAssetPrefix()).toBeUndefined();
  });

  it("désactive le CDN en preview Vercel", () => {
    setEnv({
      NODE_ENV: "production",
      VERCEL: "1",
      VERCEL_ENV: "preview",
      VERCEL_URL: "tairotairo-git-feature.vercel.app",
      NEXT_PUBLIC_CDN_URL: "https://cdn.tairotairo.mg",
      NEXT_PUBLIC_APP_URL: "https://tairotairo.mg",
    });
    expect(isCdnEnabled()).toBe(false);
  });

  it("active le CDN sur un domaine custom de production", () => {
    setEnv({
      NODE_ENV: "production",
      VERCEL: "1",
      VERCEL_ENV: "production",
      VERCEL_URL: "tairotairo-xyz.vercel.app",
      NEXT_PUBLIC_CDN_URL: "https://cdn.tairotairo.mg",
      NEXT_PUBLIC_APP_URL: "https://tairotairo.mg",
    });
    expect(isCdnEnabled()).toBe(true);
    expect(getAssetPrefix()).toBe("https://cdn.tairotairo.mg");
  });
});
