import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({ adapter }) as PrismaClientWithGeneration;
  client.__generation = PRISMA_CLIENT_GENERATION;
  return client;
}

/** Incrémenter après chaque changement de schéma pour invalider le singleton en dev. */
const PRISMA_CLIENT_GENERATION = 2;

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

export default prisma;
