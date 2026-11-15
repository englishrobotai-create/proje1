import { PrismaClient } from "@prisma/client";

/**
 * Tek bir Prisma istemcisi. Geliştirme sunucusunda yeniden yüklemelerde bağlantı sayısı
 * artmasın diye `globalThis` üzerinde önbelleğe alınır. Veritabanı PostgreSQL'dir; tablolar
 * `prisma db push` ile oluşturulur (şema: prisma/schema.prisma).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
