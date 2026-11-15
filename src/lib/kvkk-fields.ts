// İstemci tarafında da kullanılabilir (veritabanı içe aktarmaz).
// Aydınlatma metninin müşteriye göre değişen kısımları. Boş bırakılanlar için varsayılan metin kullanılır.

export const KVKK_DEFAULT_RETENTION =
  "Kişisel verileriniz, talebiniz sonuçlandırılana kadar ve ilgili mevzuatın gerektirdiği süre boyunca saklanır.";

export const KVKK_DEFAULT_RECIPIENTS =
  "Kişisel verileriniz, kanundan doğan yükümlülüklerimiz ve yetkili kamu kurumlarının talepleri dışında üçüncü kişilere aktarılmaz. Verileriniz, sitenin barındırıldığı sunucuda ve varsa bildirim e-postalarının iletildiği e-posta hizmeti sağlayıcısı üzerinde teknik olarak işlenir.";

export const KVKK_FIELDS = [
  {
    key: "controllerName",
    label: "Veri sorumlusu unvanı",
    kind: "input",
    placeholder: "Boşsa site başlığı kullanılır",
    maxLength: 120,
    hint: "",
  },
  {
    key: "kepAddress",
    label: "KEP adresi (varsa)",
    kind: "input",
    placeholder: "ornek@hs01.kep.tr",
    maxLength: 120,
    hint: "",
  },
  {
    key: "retention",
    label: "Saklama süresi",
    kind: "textarea",
    placeholder: KVKK_DEFAULT_RETENTION,
    maxLength: 800,
    hint: "Boşsa yukarıdaki varsayılan metin kullanılır. Gerçekte uyguladığınız süreyi yazın.",
  },
  {
    key: "recipients",
    label: "Verilerin aktarımı",
    kind: "textarea",
    placeholder: KVKK_DEFAULT_RECIPIENTS,
    maxLength: 800,
    hint: "Boşsa yukarıdaki varsayılan metin kullanılır. Sunucunuz veya e-posta hizmetiniz yurt dışındaysa burayı bir hukukçuyla gözden geçirin.",
  },
  {
    key: "extra",
    label: "Ek açıklama (isteğe bağlı)",
    kind: "textarea",
    placeholder: "Varsa eklemek istediğiniz bilgiler",
    maxLength: 800,
    hint: "",
  },
  {
    key: "effectiveDate",
    label: "Metnin tarihi (isteğe bağlı)",
    kind: "input",
    placeholder: "gg.aa.yyyy",
    maxLength: 40,
    hint: "",
  },
] as const;

export type KvkkKey = (typeof KVKK_FIELDS)[number]["key"];

/** Metnin tamamı yöneticice yazılmışsa burada tutulur; doluyken şablon kullanılmaz. */
export const KVKK_CUSTOM_TEXT_MAX = 15000;

export type KvkkInfo = Record<KvkkKey, string> & { customText: string };

export function normalizeLegalText(text: string): string {
  return text.replace(/\r\n?/g, "\n").trim();
}

export function emptyKvkkInfo(): KvkkInfo {
  const info = { customText: "" } as KvkkInfo;
  for (const field of KVKK_FIELDS) info[field.key] = "";
  return info;
}

/** Veritabanındaki JSON metnini güvenle çözer; bozuk ya da boşsa boş bilgi döner. */
export function parseKvkkInfo(raw: string): KvkkInfo {
  const info = emptyKvkkInfo();
  if (!raw.trim()) return info;
  try {
    const data: unknown = JSON.parse(raw);
    if (data && typeof data === "object" && !Array.isArray(data)) {
      for (const field of KVKK_FIELDS) {
        const value = (data as Record<string, unknown>)[field.key];
        if (typeof value === "string") {
          info[field.key] = value.trim().slice(0, field.maxLength);
        }
      }
      const custom = (data as Record<string, unknown>).customText;
      if (typeof custom === "string") {
        info.customText = normalizeLegalText(custom).slice(0, KVKK_CUSTOM_TEXT_MAX);
      }
    }
  } catch {
    // bozuk kayıt: boş bilgi
  }
  return info;
}

export function serializeKvkkInfo(info: KvkkInfo): string {
  const clean = emptyKvkkInfo();
  for (const field of KVKK_FIELDS) {
    clean[field.key] = (info[field.key] ?? "").trim().slice(0, field.maxLength);
  }
  clean.customText = normalizeLegalText(info.customText ?? "").slice(
    0,
    KVKK_CUSTOM_TEXT_MAX,
  );
  return JSON.stringify(clean);
}

// 6698 sayılı Kanun m.11'de sayılan haklar.
export const KVKK_RIGHTS = [
  "Kişisel verilerinizin işlenip işlenmediğini öğrenme,",
  "Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,",
  "Kişisel verilerinizin işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,",
  "Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme,",
  "Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,",
  "Kanunun 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme,",
  "Düzeltme, silme ve yok edilme işlemlerinin kişisel verilerinizin aktarıldığı üçüncü kişilere bildirilmesini isteme,",
  "İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,",
  "Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme.",
] as const;
