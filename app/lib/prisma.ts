import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { applyRlsToPgClient } from "@/lib/rls";
import { getDatabaseUrl, validateDatabaseUrl } from "@/lib/database-url";

validateDatabaseUrl();

function createRlsPool(): pg.Pool {
  const pool = new pg.Pool({
    connectionString: getDatabaseUrl(),
    max: parseInt(process.env.PG_POOL_MAX ?? "20", 10),
    idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS ?? "30000", 10),
    connectionTimeoutMillis: parseInt(process.env.PG_CONNECT_TIMEOUT_MS ?? "10000", 10),
  });

  const originalConnect = pool.connect.bind(pool);

  pool.connect = ((...args: unknown[]) => {
    const callback = args[0];

    if (typeof callback === "function") {
      return originalConnect(
        (err: Error | undefined, client: pg.PoolClient | undefined, release) => {
          if (err || !client) {
            callback(err, client, release);
            return;
          }
          void applyRlsToPgClient(client)
            .then(() => callback(null, client, release))
            .catch((applyErr: Error) => callback(applyErr, client, release));
        }
      );
    }

    return originalConnect().then(async (client) => {
      await applyRlsToPgClient(client);
      return client;
    });
  }) as typeof pool.connect;

  return pool;
}

const rlsPool = createRlsPool();

const adapter = new PrismaPg(rlsPool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({ adapter }) as PrismaClientWithGeneration;
  client.__generation = PRISMA_CLIENT_GENERATION;
  return client;
}

/** Incrémenter après chaque changement de schéma pour invalider le singleton en dev. */
const PRISMA_CLIENT_GENERATION = 4;

type PrismaClientWithGeneration = PrismaClient & { __generation?: number };

/** Détecte un singleton Prisma obsolète (ex. après `prisma generate` sans redémarrage du serveur). */
function isStalePrismaClient(client: PrismaClient): boolean {
  const tagged = client as PrismaClientWithGeneration;
  if (tagged.__generation !== PRISMA_CLIENT_GENERATION) return true;

  return (
    !("providerKycDocument" in client) ||
    !("providerPortfolioItem" in client) ||
    !("providerSubscription" in client)
  );
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (
    cached &&
    (process.env.NODE_ENV === "production" || !isStalePrismaClient(cached))
  ) {
    return cached;
  }
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

const prisma = getPrismaClient();

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  await rlsPool.end();
}

export default prisma;
