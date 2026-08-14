import { spawn } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const ROOT = path.resolve(import.meta.dirname, "..");
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");
const LOCK_ID = 7_410_826_031;

const LEGACY_MIGRATIONS = new Set([
  "20260605080958_001_enums.sql",
  "20260605081029_002_users_auth_tables.sql",
  "20260605081058_003_services_requests.sql",
  "20260605081125_004_bookings_transactions.sql",
  "20260605081151_005_messaging_notifications.sql",
  "20260605081221_006_portfolio_reviews_kyc.sql",
  "20260605081300_007_kyc_pending.sql",
  "20260605081400_008_subscription_payments.sql",
  "20260605081500_009_drop_kyc_residence_certificate.sql",
  "20260629120000_010_rls_enforcement.sql",
]);

function log(message) {
  process.stdout.write(`${message}\n`);
}

const RLS_FOUNDATION = `
CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS text
  LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '');
$$;

CREATE OR REPLACE FUNCTION app.current_user_role() RETURNS text
  LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_role', true), '');
$$;

CREATE OR REPLACE FUNCTION app.bypass_rls() RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true';
$$;

CREATE OR REPLACE FUNCTION app.is_authenticated() RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT app.current_user_id() IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION app.is_admin() RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT app.bypass_rls() OR app.current_user_role() = 'ADMIN';
$$;

CREATE OR REPLACE FUNCTION app.is_provider() RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT app.current_user_role() IN ('PROVIDER', 'ADMIN');
$$;

CREATE OR REPLACE FUNCTION app.is_client() RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT app.current_user_role() IN ('CLIENT', 'ADMIN');
$$;
`;

const DROP_PUBLIC_POLICIES = `
DO $$
DECLARE policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  END LOOP;
END $$;
`;

function databaseUrl() {
  const value =
    process.env.DATABASE_URL_UNPOOLED?.trim() ??
    process.env.POSTGRES_URL_NON_POOLING?.trim() ??
    process.env.DATABASE_URL?.trim();

  if (!value || value === "[SENSITIVE]") {
    throw new Error(
      "Aucune URL Neon directe n'est disponible. Ce script doit s'exécuter dans un build Vercel."
    );
  }

  const parsed = new URL(value);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error("L'URL de base injectée par Vercel n'est pas une URL PostgreSQL.");
  }

  return value;
}

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env,
      stdio: "inherit",
      shell: false,
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} a échoué (code ${code ?? "inconnu"}).`));
    });
  });
}

async function migrationFiles() {
  return (await readdir(MIGRATIONS_DIR))
    .filter((name) => name.endsWith(".sql") && !LEGACY_MIGRATIONS.has(name))
    .sort();
}

function adaptForNeon(name, sql) {
  let adapted = sql.replace(/^GRANT .* TO tairo_app;\s*$/gm, "");

  if (name === "20260629130000_011_rls_prisma_schema.sql") {
    // The application connects with the Neon owner role. The optional tairo_app
    // role belongs to the former self-hosted PostgreSQL setup.
    adapted = `${DROP_PUBLIC_POLICIES}\n${adapted}`;
  }
  if (name === "20260720100000_022_ecosystem_rental_learning.sql") {
    // Prisma maps DateTime to timestamp(3) without time zone on PostgreSQL.
    // tstzrange would add a timezone-dependent cast, which PostgreSQL refuses
    // in an exclusion index because the resulting expression is not immutable.
    adapted = adapted.replace(
      `tstzrange("startDate", "endDate", '[)')`,
      `tsrange("startDate", "endDate", '[)')`
    );
  }
  return adapted;
}

async function applyMigrations(client, files) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS app."_TairoMigration" (
      name text PRIMARY KEY,
      "appliedAt" timestamptz NOT NULL DEFAULT now()
    )
  `);

  await client.query(RLS_FOUNDATION);
  await client.query("SELECT set_config('app.bypass_rls', 'true', false)");

  const appliedResult = await client.query('SELECT name FROM app."_TairoMigration"');
  const applied = new Set(appliedResult.rows.map((row) => row.name));

  for (const name of files) {
    if (applied.has(name)) {
      log(`[migration] déjà appliquée : ${name}`);
      continue;
    }

    const rawSql = await readFile(path.join(MIGRATIONS_DIR, name), "utf8");
    const sql = adaptForNeon(name, rawSql);

    log(`[migration] application : ${name}`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query('INSERT INTO app."_TairoMigration" (name) VALUES ($1)', [name]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Échec de ${name}: ${error instanceof Error ? error.message : String(error)}`, {
        cause: error,
      });
    }
  }
}

async function verify(client, expectedMigrations) {
  const result = await client.query(`
    SELECT
      to_regclass('public."User"') IS NOT NULL AS "hasUser",
      to_regclass('public."Service"') IS NOT NULL AS "hasService",
      to_regclass('public."EquipmentItem"') IS NOT NULL AS "hasEquipment",
      to_regclass('public."Course"') IS NOT NULL AS "hasCourse",
      EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'app') AS "hasAppSchema",
      (SELECT count(*)::int FROM pg_policies WHERE schemaname = 'public') AS "policyCount",
      (SELECT count(*)::int FROM app."_TairoMigration") AS "migrationCount"
  `);
  const state = result.rows[0];

  if (
    !state.hasUser ||
    !state.hasService ||
    !state.hasEquipment ||
    !state.hasCourse ||
    !state.hasAppSchema ||
    state.policyCount < 1 ||
    state.migrationCount !== expectedMigrations
  ) {
    throw new Error(`Vérification du schéma incomplète: ${JSON.stringify(state)}`);
  }

  log(
    `[migration] vérifiée : ${state.migrationCount} migrations, ${state.policyCount} politiques RLS.`
  );
}

async function main() {
  const url = databaseUrl();
  const files = await migrationFiles();

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);
    await client.query("CREATE SCHEMA IF NOT EXISTS app");
    await client.query('ALTER TABLE IF EXISTS public."_TairoMigration" SET SCHEMA app');

    const tables = await client.query(
      `SELECT to_regclass('public."User"') IS NOT NULL AS "hasUser"`
    );
    const hasUserTable = Boolean(tables.rows[0]?.hasUser);

    async function pushSchema() {
      log("[migration] synchronisation du schéma Prisma sur Neon…");
      await run(
        process.platform === "win32" ? "npx.cmd" : "npx",
        ["prisma", "db", "push"],
        { ...process.env, DATABASE_URL: url }
      );
    }

    if (hasUserTable) {
      // Base déjà provisionnée : le SQL (ex. 028) dédoublonne et pose les
      // uniques avant `db push`. Un push trop tôt refuse d'ajouter `User.phone`
      // @unique sans --accept-data-loss, même si le SQL doit d'abord nettoyer.
      log("[migration] application des migrations SQL (nettoyage + index)…");
      await applyMigrations(client, files);
      await pushSchema();
    } else {
      // Base vide : 011+ lit `"User"`. Prisma crée d'abord les tables.
      await pushSchema();
      log("[migration] application des migrations SQL…");
      await applyMigrations(client, files);
    }

    await verify(client, files.length);
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]).catch(() => undefined);
    await client.end();
  }
}

main().catch((error) => {
  console.error("[migration]", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
