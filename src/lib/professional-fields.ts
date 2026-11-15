// İstemci tarafında da kullanılabilir (veritabanı içe aktarmaz).
// Alanlar, SMMM/YMM Haksız Rekabet ve Reklam Yasağı Yönetmeliği'nin 22. maddesinde
// internet sitesinde bulunması istenen bilgilerden alınmıştır.
export const PROFESSIONAL_FIELDS = [
  { key: "academicTitle", label: "Akademik unvan", placeholder: "Varsa yazın" },
  { key: "officeTitle", label: "Büro / mesleki şirket unvanı", placeholder: "Varsa yazın" },
  { key: "chamber", label: "Bağlı olduğu oda", placeholder: "Odanızın adı" },
  { key: "registryNo", label: "Oda sicil numarası", placeholder: "" },
  { key: "officeNo", label: "Büro numarası", placeholder: "" },
  { key: "startDate", label: "Mesleğe başlama tarihi", placeholder: "gg.aa.yyyy" },
  { key: "university", label: "Mezun olduğu üniversite", placeholder: "" },
  { key: "languages", label: "Bildiği yabancı diller", placeholder: "Varsa yazın" },
  { key: "fax", label: "Faks", placeholder: "Varsa yazın" },
] as const;

export type ProfessionalKey = (typeof PROFESSIONAL_FIELDS)[number]["key"];
export type ProfessionalInfo = Record<ProfessionalKey, string>;

export const PROFESSIONAL_MAX_LENGTH = 120;

export function emptyProfessionalInfo(): ProfessionalInfo {
  const info = {} as ProfessionalInfo;
  for (const field of PROFESSIONAL_FIELDS) info[field.key] = "";
  return info;
}

/** Veritabanındaki JSON metnini güvenle çözer; bozuk ya da boşsa boş bilgi döner. */
export function parseProfessionalInfo(raw: string): ProfessionalInfo {
  const info = emptyProfessionalInfo();
  if (!raw.trim()) return info;
  try {
    const data: unknown = JSON.parse(raw);
    if (data && typeof data === "object" && !Array.isArray(data)) {
      for (const field of PROFESSIONAL_FIELDS) {
        const value = (data as Record<string, unknown>)[field.key];
        if (typeof value === "string") {
          info[field.key] = value.trim().slice(0, PROFESSIONAL_MAX_LENGTH);
        }
      }
    }
  } catch {
    // bozuk kayıt: boş bilgi
  }
  return info;
}

export function serializeProfessionalInfo(info: ProfessionalInfo): string {
  const clean = emptyProfessionalInfo();
  for (const field of PROFESSIONAL_FIELDS) {
    clean[field.key] = (info[field.key] ?? "")
      .trim()
      .slice(0, PROFESSIONAL_MAX_LENGTH);
  }
  return JSON.stringify(clean);
}

/** Dolu alanları sitede gösterilecek satırlara çevirir. */
export function professionalRows(info: ProfessionalInfo) {
  return PROFESSIONAL_FIELDS.filter((field) => info[field.key].length > 0).map(
    (field) => ({ key: field.key, label: field.label, value: info[field.key] }),
  );
}

/** Henüz doldurulmamış alanların etiketleri (varsa-yazın alanları dâhil). */
export function missingProfessionalLabels(info: ProfessionalInfo): string[] {
  return PROFESSIONAL_FIELDS.filter((field) => info[field.key].length === 0).map(
    (field) => field.label,
  );
}
