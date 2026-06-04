import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({ adapter });
}

/** Détecte un singleton Prisma obsolète (ex. après `prisma generate` sans redémarrage du serveur). */
function isStalePrismaClient(client: PrismaClient): boolean {
  return !("providerKycDocument" in client);
}

let prisma = globalForPrisma.prisma;

if (!prisma || (process.env.NODE_ENV !== "production" && isStalePrismaClient(prisma))) {
  prisma = createPrismaClient();
}

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
