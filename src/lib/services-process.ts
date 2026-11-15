import { ensureColumns, prisma } from "./db";

// Her satır bir adım: "Başlık | Açıklama"
export const DEFAULT_SERVICES_PROCESS = [
  "Tanışma ve ihtiyaç belirleme | İşletmenizin türünü, mevcut muhasebe düzenini ve beklentilerinizi birlikte netleştiririz.",
  "Kapsamın belirlenmesi | Hangi işlerin ofisimizce üstlenileceğini ve belgelerin nasıl iletileceğini baştan konuşur, çalışma düzenini oluştururuz.",
  "Düzenli muhasebe ve beyanlar | Belgeleriniz işlenir; beyan ve bildirimler yasal sürelerine uygun şekilde hazırlanır.",
  "Bilgilendirme ve danışmanlık | Mali durumunuz ve mevzuat değişiklikleri hakkındaki sorularınızı yanıtlarız.",
].join("\n");

export type ProcessStep = { title: string; text: string };

/** "Başlık | Açıklama" satırlarını adım listesine çevirir (en fazla 8 adım). */
export function parseProcessSteps(raw: string): ProcessStep[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((line) => {
      const cut = line.indexOf("|");
      return cut === -1
        ? { title: line, text: "" }
        : {
            title: line.slice(0, cut).trim(),
            text: line.slice(cut + 1).trim(),
          };
    })
    .filter((step) => step.title.length > 0);
}

/**
 * Kayıtlı adım metnini döndürür; kayıt yoksa ya da okunamazsa varsayılanı verir.
 * Sütun ham SQL ile okunur: Prisma istemcisi yeniden üretilmemiş olsa da çalışır.
 */
export async function getServicesProcess(): Promise<string> {
  try {
    await ensureColumns();
    const rows = await prisma.$queryRaw<{ servicesProcess: string | null }[]>`
      SELECT "servicesProcess" FROM "Setting" WHERE "id" = 'main' LIMIT 1
    `;
    const value = rows[0]?.servicesProcess?.trim();
    return value ? value : DEFAULT_SERVICES_PROCESS;
  } catch {
    return DEFAULT_SERVICES_PROCESS;
  }
}

export async function saveServicesProcess(text: string): Promise<void> {
  await ensureColumns();
  // Ayar satırı henüz yoksa oluştur (diğer ayarlar için varsayılanlar geçerli olur).
  await prisma.setting.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", siteTitle: "Mali Müşavirlik" },
  });
  await prisma.$executeRaw`
    UPDATE "Setting" SET "servicesProcess" = ${text} WHERE "id" = 'main'
  `;
}
