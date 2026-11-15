import { ensureColumns, prisma } from "./db";
import { parseKvkkInfo, serializeKvkkInfo, type KvkkInfo } from "./kvkk-fields";

/**
 * Aydınlatma metninin müşteriye özel alanları Setting tablosundaki `kvkkInfo` sütununda JSON olarak tutulur.
 * Ham SQL kullanılır; `prisma db push` yapılmamış olsa da sütun ilk kullanımda kendiliğinden eklenir.
 */
export async function getKvkkInfo(): Promise<KvkkInfo> {
  try {
    await ensureColumns();
    const rows = await prisma.$queryRaw<{ kvkkInfo: string | null }[]>`
      SELECT "kvkkInfo" FROM "Setting" WHERE "id" = 'main' LIMIT 1
    `;
    return parseKvkkInfo(rows[0]?.kvkkInfo ?? "");
  } catch {
    return parseKvkkInfo("");
  }
}

export async function saveKvkkInfo(info: KvkkInfo): Promise<void> {
  await ensureColumns();
  await prisma.setting.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", siteTitle: "Mali Müşavirlik" },
  });
  const json = serializeKvkkInfo(info);
  await prisma.$executeRaw`
    UPDATE "Setting" SET "kvkkInfo" = ${json} WHERE "id" = 'main'
  `;
}
