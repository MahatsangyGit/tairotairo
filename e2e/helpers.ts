import type { APIRequestContext } from "@playwright/test";
import pg from "pg";

const PASSWORD = "E2eTest!2026";

/** Dummy token accepted by Cloudflare test secret keys only. */
const TURNSTILE_DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

function identityHeaders(identity: string): Record<string, string> {
  let hash = 0;
  for (const character of identity) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return {
    "x-real-ip": `198.18.${((hash >>> 8) % 254) + 1}.${(hash % 254) + 1}`,
  };
}

export function turnstileFields(): { turnstileToken?: string } {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!secret || !siteKey) return {};
  if (secret === "1x0000000000000000000000000000000AA") {
    return { turnstileToken: TURNSTILE_DUMMY_TOKEN };
  }
  return {};
}

const CSRF_EXEMPT_PREFIXES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

function getPool() {
  return new pg.Pool({ connectionString: process.env.DATABASE_URL! });
}

export const E2E_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

export interface TestUsers {
  runId: string;
  provider: { email: string; password: string; id: string };
  client: { email: string; password: string; id: string };
  admin: { email: string; password: string; id: string };
}

function isCsrfExempt(url: string): boolean {
  return CSRF_EXEMPT_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export async function getCsrfToken(request: APIRequestContext): Promise<string> {
  const res = await request.get("/api/auth/csrf");
  const body = await res.json();
  if (!res.ok() || !body.csrfToken) {
    throw new Error("Failed to obtain CSRF token for e2e tests");
  }
  return body.csrfToken as string;
}

async function withCsrfHeaders(
  request: APIRequestContext,
  url: string,
  headers: Record<string, string> = {}
): Promise<Record<string, string>> {
  if (isCsrfExempt(url)) {
    return headers;
  }

  return {
    ...headers,
    "X-CSRF-Token": await getCsrfToken(request),
  };
}

export async function apiPost(
  request: APIRequestContext,
  url: string,
  options?: Parameters<APIRequestContext["post"]>[1]
) {
  const headers = await withCsrfHeaders(
    request,
    url,
    (options?.headers as Record<string, string> | undefined) ?? {}
  );
  return request.post(url, { ...options, headers });
}

export async function apiPatch(
  request: APIRequestContext,
  url: string,
  options?: Parameters<APIRequestContext["patch"]>[1]
) {
  const headers = await withCsrfHeaders(
    request,
    url,
    (options?.headers as Record<string, string> | undefined) ?? {}
  );
  return request.patch(url, { ...options, headers });
}

export async function apiDelete(
  request: APIRequestContext,
  url: string,
  options?: Parameters<APIRequestContext["delete"]>[1]
) {
  const headers = await withCsrfHeaders(
    request,
    url,
    (options?.headers as Record<string, string> | undefined) ?? {}
  );
  return request.delete(url, { ...options, headers });
}

export async function createTestUsers(runId: string): Promise<TestUsers> {
  const providerEmail = `e2e-provider-${runId}@test.local`;
  const clientEmail = `e2e-client-${runId}@test.local`;
  const adminEmail = `e2e-admin-${runId}@test.local`;

  const pool = getPool();
  try {
    await pool.query(`DELETE FROM "User" WHERE email = ANY($1)`, [
      [providerEmail, clientEmail, adminEmail],
    ]);
  } finally {
    await pool.end();
  }

  return {
    runId,
    provider: { email: providerEmail, password: PASSWORD, id: "" },
    client: { email: clientEmail, password: PASSWORD, id: "" },
    admin: { email: adminEmail, password: PASSWORD, id: "" },
  };
}

export async function verifyUserEmail(email: string) {
  const pool = getPool();
  try {
    await pool.query(
      `UPDATE "User" SET "emailVerified" = true, "emailVerifiedAt" = NOW() WHERE email = $1`,
      [email]
    );
  } finally {
    await pool.end();
  }
}

export function uniqueMgPhone(seed: string): string {
  let hash = 0;
  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return `034${String(hash % 10_000_000).padStart(7, "0")}`;
}

export async function registerUser(
  request: APIRequestContext,
  data: {
    name: string;
    email: string;
    password: string;
    role: "CLIENT" | "PROVIDER";
    phone?: string;
  }
) {
  const phone = data.phone ?? uniqueMgPhone(data.email);
  const res = await request.post("/api/auth/register", {
    data: { ...data, phone, ...turnstileFields() },
    headers: identityHeaders(data.email),
  });
  const body = await res.json();
  if (!res.ok()) {
    throw new Error(`Register failed (${res.status()}): ${body.error ?? JSON.stringify(body)}`);
  }
  return body;
}

export async function login(
  request: APIRequestContext,
  email: string,
  password: string
) {
  const res = await request.post("/api/auth/login", {
    data: { email, password, ...turnstileFields() },
    headers: identityHeaders(email),
  });
  const body = await res.json();
  if (!res.ok()) {
    throw new Error(`Login failed (${res.status()}): ${body.error ?? JSON.stringify(body)}`);
  }
  return body.user as { id: string; role: string };
}

export async function promoteToAdmin(email: string) {
  const pool = getPool();
  try {
    await pool.query(`UPDATE "User" SET role = 'ADMIN' WHERE email = $1`, [email]);
  } finally {
    await pool.end();
  }
}

export async function cleanupTestUsers(emails: string[]) {
  const pool = getPool();
  try {
    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM "User" WHERE email = ANY($1)`,
      [emails]
    );
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return;

    await pool.query(
      `DELETE FROM "Booking" WHERE "clientId" = ANY($1) OR "providerId" = ANY($1)`,
      [ids]
    );
    await pool.query(
      `DELETE FROM "ProviderKycDocument" WHERE "userId" = ANY($1)`,
      [ids]
    );
    await pool.query(
      `DELETE FROM "ProviderSubscriptionPayment" WHERE "providerId" = ANY($1)`,
      [ids]
    );
    await pool.query(
      `DELETE FROM "ProviderSubscription" WHERE "providerId" = ANY($1)`,
      [ids]
    );
    await pool.query(`DELETE FROM "Service" WHERE "providerId" = ANY($1)`, [ids]);
    await pool.query(`DELETE FROM "User" WHERE id = ANY($1)`, [ids]);
  } finally {
    await pool.end();
  }
}

export async function futureBookingDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export { PASSWORD };
