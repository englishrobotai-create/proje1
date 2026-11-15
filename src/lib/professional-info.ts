import { prisma } from "./db";
import {
  parseProfessionalInfo,
  serializeProfessionalInfo,
  type ProfessionalInfo,
} from "./professional-fields";

/**
 * Mesleki bilgiler Setting tablosundaki `professionalInfo` sütununda JSON olarak tutulur.
 * Sütun ham SQL ile okunur/yazılır.
 */
export async function getProfessionalInfo(): Promise<ProfessionalInfo> {
  try {
    const rows = await prisma.$queryRaw<{ professionalInfo: string | null }[]>`
      SELECT "professionalInfo" FROM "Setting" WHERE "id" = 'main' LIMIT 1
    `;
    return parseProfessionalInfo(rows[0]?.professionalInfo ?? "");
  } catch {
    return parseProfessionalInfo("");
  }
}

export async function saveProfessionalInfo(
  info: ProfessionalInfo,
): Promise<void> {
  await prisma.setting.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", siteTitle: "Mali Müşavirlik" },
  });
  const json = serializeProfessionalInfo(info);
  await prisma.$executeRaw`
    UPDATE "Setting" SET "professionalInfo" = ${json} WHERE "id" = 'main'
  `;
}
