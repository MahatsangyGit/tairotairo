import { z } from "zod";

function vapidSubjectSchema() {
  return z
    .string()
    .optional()
    .transform((v) => (v?.trim() === "" ? undefined : v))
    .refine(
      (v) => {
        if (!v) return true;
        if (v.startsWith("mailto:")) {
          return z.string().email().safeParse(v.slice("mailto:".length)).success;
        }
        if (v.startsWith("https://")) {
          return z.string().url().safeParse(v).success;
        }
        return z.string().email().safeParse(v).success;
      },
      {
        message:
          "VAPID_SUBJECT doit être un email, mailto:email ou une URL https://",
      }
    );
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(16).optional(),
  REDIS_URL: z.string().url().optional(),
  HOSTNAME: z.string().optional(),
  PORT: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).optional(),
  VAPID_SUBJECT: vapidSubjectSchema(),
  PLAYWRIGHT_BASE_URL: z.string().url().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) return cached;
  cached = envSchema.parse(process.env);
  return cached;
}

export function validateEnvAtBoot(): void {
  const env = getEnv();
  if (env.NODE_ENV === "production" && !env.CRON_SECRET) {
    throw new Error("CRON_SECRET est obligatoire en production");
  }
  if (env.NODE_ENV === "production" && !env.REDIS_URL) {
    throw new Error("REDIS_URL est obligatoire en production");
  }
  if (
    env.NODE_ENV === "production" &&
    process.env.TAIRO_CUSTOM_SERVER !== "1"
  ) {
    throw new Error(
      "Le serveur custom (server.ts / dist/server.js) est obligatoire en production. N'utilisez pas `next start`."
    );
  }
}

export function getBcryptRounds(): number {
  return getEnv().BCRYPT_ROUNDS ?? 10;
}
