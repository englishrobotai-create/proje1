import { PrismaClient } from "@prisma/client";

type AddedColumn = { name: string; ddl: string };

/**
 * Tablolara sonradan eklenen sütunlar. Şemada (schema.prisma) da tanımlıdır;
 * `prisma db push` yapılmamış bir veritabanında ilk kullanımda kendiliğinden eklenir.
 */
const ADDED_COLUMNS: { table: string; columns: AddedColumn[] }[] = [
  {
    table: "Setting",
    columns: [
      { name: "servicesProcess", ddl: `"servicesProcess" TEXT NOT NULL DEFAULT ''` },
      { name: "professionalInfo", ddl: `"professionalInfo" TEXT NOT NULL DEFAULT ''` },
      { name: "kvkkInfo", ddl: `"kvkkInfo" TEXT NOT NULL DEFAULT ''` },
      // Hakkımda sayfası fotoğrafı (JSON: göster/gizle, uzantı, sürüm). Ham SQL ile okunur/yazılır.
      { name: "aboutPhoto", ddl: `"aboutPhoto" TEXT NOT NULL DEFAULT ''` },
      // Mükellef Köşesi açık mı (0/1). Ham SQL ile okunur/yazılır (portal-db.ts).
      { name: "portalEnabled", ddl: `"portalEnabled" INTEGER NOT NULL DEFAULT 0` },
    ],
  },
  {
    table: "Post",
    columns: [
      { name: "seoTitle", ddl: `"seoTitle" TEXT NOT NULL DEFAULT ''` },
      { name: "seoDescription", ddl: `"seoDescription" TEXT NOT NULL DEFAULT ''` },
      { name: "slugHistory", ddl: `"slugHistory" TEXT NOT NULL DEFAULT ''` },
      { name: "publishedAt", ddl: `"publishedAt" TEXT NOT NULL DEFAULT ''` },
      { name: "authorName", ddl: `"authorName" TEXT NOT NULL DEFAULT ''` },
    ],
  },
];

async function addMissingColumns(client: PrismaClient) {
  for (const { table, columns } of ADDED_COLUMNS) {
    const read = () =>
      client.$queryRawUnsafe<{ name: string }[]>(`PRAGMA table_info("${table}")`);

    const existing = await read();
    if (existing.length === 0) continue; // tablo henüz yok (ilk kurulumda db push oluşturur)

    for (const column of columns) {
      if (existing.some((item) => item.name === column.name)) continue;
      try {
        await client.$executeRawUnsafe(
          `ALTER TABLE "${table}" ADD COLUMN ${column.ddl}`,
        );
      } catch (error) {
        // Eşzamanlı başka bir istek sütunu az önce eklemiş olabilir.
        const after = await read();
        if (!after.some((item) => item.name === column.name)) throw error;
      }
    }
  }
}

// Yalnızca ham istemci önbelleğe alınır; sütun denetimi bu modül her yüklendiğinde yeniden kurulur.
// Böylece geliştirme sunucusunda ADDED_COLUMNS'a sütun eklemek yeniden başlatma gerektirmez.
const globalForPrisma = globalThis as unknown as {
  prismaBase: PrismaClient | undefined;
};

const base =
  globalForPrisma.prismaBase ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaBase = base;
}

let ready: Promise<void> | undefined;

export const ensureColumns = (): Promise<void> => {
  ready ??= addMissingColumns(base).catch((error) => {
    ready = undefined;
    throw error;
  });
  return ready;
};

export const prisma = base.$extends({
  query: {
    setting: {
      async $allOperations({ args, query }) {
        // Sütun eklenemezse yine de normal sorguyu dene; site açık kalsın.
        await ensureColumns().catch(() => undefined);
        return query(args);
      },
    },
    post: {
      async $allOperations({ args, query }) {
        await ensureColumns().catch(() => undefined);
        return query(args);
      },
    },
  },
});
