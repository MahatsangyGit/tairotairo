import { test, expect } from "@playwright/test";
import pg from "pg";
import { LOGIN_LOCKED_MESSAGE, MAX_FAILED_LOGIN_ATTEMPTS } from "../app/lib/login-lockout";
import {
  apiPatch,
  apiPost,
  cleanupTestUsers,
  login,
  PASSWORD,
  promoteToAdmin,
  registerUser,
  turnstileFields,
  verifyUserEmail,
} from "./helpers";
import {
  generatePasswordResetToken,
  getPasswordResetExpiry,
} from "../app/lib/password-reset";
import { generateOtpCode, getOtpExpiry, hashOtpCode } from "../app/lib/otp";

const runId = `fail-${Date.now()}`;
const clientEmail = `e2e-fail-client-${runId}@test.local`;
const adminEmail = `e2e-fail-admin-${runId}@test.local`;
const ghostEmail = `ghost-${runId}@doesnotexist.test`;

function getPool() {
  return new pg.Pool({ connectionString: process.env.DATABASE_URL! });
}

async function seedPasswordResetToken(userId: string): Promise<string> {
  const { raw, hash } = generatePasswordResetToken();
  const pool = getPool();
  try {
    await pool.query(`DELETE FROM "PasswordResetToken" WHERE "userId" = $1`, [
      userId,
    ]);
    await pool.query(
      `INSERT INTO "PasswordResetToken" (id, "userId", "tokenHash", "expiresAt", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [`prt-${runId}`, userId, hash, getPasswordResetExpiry()]
    );
  } finally {
    await pool.end();
  }
  return raw;
}

async function seedEmailOtp(userId: string): Promise<string> {
  const code = generateOtpCode();
  const codeHash = await hashOtpCode(code);
  const pool = getPool();
  try {
    await pool.query(`DELETE FROM "EmailOtp" WHERE "userId" = $1`, [userId]);
    await pool.query(
      `INSERT INTO "EmailOtp" (id, "userId", "codeHash", "expiresAt", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [`otp-${runId}`, userId, codeHash, getOtpExpiry()]
    );
    await pool.query(
      `UPDATE "User" SET "emailVerified" = false, "emailVerifiedAt" = NULL WHERE id = $1`,
      [userId]
    );
  } finally {
    await pool.end();
  }
  return code;
}

test.describe.serial("Auth — chemins d'échec", () => {
  let userId = "";

  test.afterAll(async () => {
    await cleanupTestUsers([clientEmail, adminEmail]);
  });

  test("prépare un compte client", async ({ request }) => {
    await registerUser(request, {
      name: "Fail Path Client",
      email: clientEmail,
      password: PASSWORD,
      role: "CLIENT",
    });
    await verifyUserEmail(clientEmail);
    const user = await login(request, clientEmail, PASSWORD);
    userId = user.id;
    expect(userId).toBeTruthy();
  });

  test("login — verrouillage après 5 échecs et déblocage admin", async (
    { request },
    testInfo
  ) => {
    const loginHeaders = {
      "x-real-ip": `198.18.${testInfo.retry + 1}.10`,
    };

    for (let i = 1; i < MAX_FAILED_LOGIN_ATTEMPTS; i++) {
      const res = await request.post("/api/auth/login", {
        data: { email: clientEmail, password: `wrong-password-${i}`, ...turnstileFields() },
        headers: loginHeaders,
      });
      const body = await res.json();

      expect(res.status(), `tentative ${i}`).toBe(401);
      expect(body.error).toBe("Email ou mot de passe incorrect");
    }

    const fifth = await request.post("/api/auth/login", {
      data: { email: clientEmail, password: "wrong-password-5", ...turnstileFields() },
      headers: loginHeaders,
    });
    const fifthBody = await fifth.json();
    expect(fifth.status()).toBe(423);
    expect(fifthBody.error).toBe(LOGIN_LOCKED_MESSAGE);

    const blocked = await request.post("/api/auth/login", {
      data: { email: clientEmail, password: PASSWORD, ...turnstileFields() },
      headers: loginHeaders,
    });
    const blockedBody = await blocked.json();
    expect(blocked.status()).toBe(423);
    expect(blockedBody.error).toBe(LOGIN_LOCKED_MESSAGE);

    await registerUser(request, {
      name: "Fail Path Admin",
      email: adminEmail,
      password: PASSWORD,
      role: "CLIENT",
    });
    await promoteToAdmin(adminEmail);
    await login(request, adminEmail, PASSWORD);

    const unlock = await apiPatch(request, `/api/admin/users/${userId}`, {
      data: { action: "unlockLogin" },
    });
    const unlockBody = await unlock.json();
    expect(unlock.status()).toBe(200);
    expect(unlockBody.message).toContain("débloquée");

    const ok = await request.post("/api/auth/login", {
      data: { email: clientEmail, password: PASSWORD, ...turnstileFields() },
      headers: loginHeaders,
    });
    expect(ok.status()).toBe(200);
  });

  test("forgot-password — email inexistant (réponse générique)", async ({
    request,
  }) => {
    const res = await request.post("/api/auth/forgot-password", {
      data: { email: ghostEmail, ...turnstileFields() },
    });
    const body = await res.json();

    expect(res.status()).toBe(200);
    expect(body.message).toBe(
      "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation."
    );
    expect(body.error).toBeUndefined();
  });

  test("reset-password — lien utilisé deux fois", async ({ request }) => {
    const rawToken = await seedPasswordResetToken(userId);
    const newPassword = "ResetOk!2026";

    const first = await request.post("/api/auth/reset-password", {
      data: { token: rawToken, password: newPassword },
    });
    const firstBody = await first.json();
    expect(first.status()).toBe(200);
    expect(firstBody.message).toContain("Mot de passe mis à jour");

    const second = await request.post("/api/auth/reset-password", {
      data: { token: rawToken, password: "AnotherPass!99" },
    });
    const secondBody = await second.json();
    expect(second.status()).toBe(400);
    expect(secondBody.error).toContain("invalide ou a expiré");

    await request.post("/api/auth/login", {
      data: { email: clientEmail, password: newPassword, ...turnstileFields() },
    });
  });

  test("verify-otp — code de vérification soumis deux fois", async ({
    request,
  }) => {
    const code = await seedEmailOtp(userId);

    const loginRes = await request.post("/api/auth/login", {
      data: { email: clientEmail, password: "ResetOk!2026", ...turnstileFields() },
    });
    expect(loginRes.status()).toBe(200);

    const first = await apiPost(request, "/api/auth/email/verify-otp", {
      data: { code },
    });
    const firstBody = await first.json();
    expect(first.status()).toBe(200);
    expect(firstBody.emailVerified).toBe(true);

    const second = await apiPost(request, "/api/auth/email/verify-otp", {
      data: { code },
    });
    const secondBody = await second.json();
    expect(second.status()).toBe(400);
    expect(secondBody.error).toMatch(/expiré|introuvable/i);
  });

  test("register — email déjà utilisé", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: {
        name: "Doublon",
        email: clientEmail,
        password: "AnotherPass!99",
        role: "CLIENT",
        ...turnstileFields(),
      },
    });
    const body = await res.json();

    expect(res.status()).toBe(400);
    expect(body.error).toBe(
      "Impossible de créer le compte avec ces informations."
    );
  });
});
