import { prisma } from "./db";
import { parseKvkkInfo, serializeKvkkInfo, type KvkkInfo } from "./kvkk-fields";

/**
 * Aydınlatma metninin müşteriye özel alanları Setting tablosundaki `kvkkInfo` sütununda JSON olarak tutulur.
 * Sütun ham SQL ile okunur/yazılır.
 */
export async function getKvkkInfo(): Promise<KvkkInfo> {
  try {
    const rows = await prisma.$queryRaw<{ kvkkInfo: string | null }[]>`
      SELECT "kvkkInfo" FROM "Setting" WHERE "id" = 'main' LIMIT 1
    `;
    return parseKvkkInfo(rows[0]?.kvkkInfo ?? "");
  } catch {
    return parseKvkkInfo("");
  }
}

export async function saveKvkkInfo(info: KvkkInfo): Promise<void> {
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
