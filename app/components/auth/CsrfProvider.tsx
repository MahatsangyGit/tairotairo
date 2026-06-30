"use client";

import { useEffect, type ReactNode } from "react";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCsrfCookie(): string | undefined {
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("csrf-token="));
  if (!match) return undefined;
  return decodeURIComponent(match.slice("csrf-token=".length));
}

function shouldAttachCsrf(url: string, method: string): boolean {
  if (!url.startsWith("/api")) return false;
  if (!MUTATING_METHODS.has(method)) return false;

  const exempt = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ];

  return !exempt.some((prefix) => url.startsWith(prefix));
}

/** Bootstraps CSRF cookie and patches fetch for mutating API calls. */
export default function CsrfProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void fetch("/api/auth/csrf", { credentials: "include" });

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      const method = (init?.method ?? "GET").toUpperCase();
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.pathname
            : input.url;

      if (shouldAttachCsrf(url, method)) {
        const csrf = readCsrfCookie();
        if (csrf) {
          const headers = new Headers(init?.headers);
          headers.set("X-CSRF-Token", csrf);
          init = { ...init, headers };
        }
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return children;
}
