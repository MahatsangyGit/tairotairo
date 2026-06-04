import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({ adapter });
}

/** Détecte un singleton Prisma obsolète (ex. après `prisma generate` sans redémarrage du serveur). */
function isStalePrismaClient(client: PrismaClient): boolean {
  return !("providerKycDocument" in client);
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
