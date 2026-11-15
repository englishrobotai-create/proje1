// Aydınlatma metni: şablon üretimi ve düz metin ayrıştırma. Veritabanı içe aktarmaz (istemcide de kullanılabilir).
//
// Düz metin biçimi:
//   - Boş satır yeni paragraf açar.
//   - "## " ile başlayan satır başlıktır.
//   - "- " ile başlayan ardışık satırlar madde işaretli liste olur.
import {
  KVKK_DEFAULT_RECIPIENTS,
  KVKK_DEFAULT_RETENTION,
  KVKK_RIGHTS,
  type KvkkInfo,
} from "./kvkk-fields";

export type LegalBlock =
  | { type: "h"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export function parseLegalText(text: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] | null = null;

  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "p", text: paragraph.join("\n") });
      paragraph = [];
    }
    if (list && list.length > 0) {
      blocks.push({ type: "ul", items: list });
    }
    list = null;
  };

  for (const rawLine of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trimEnd();
    if (line.trim() === "") {
      flush();
    } else if (line.startsWith("## ")) {
      flush();
      const heading = line.slice(3).trim();
      if (heading) blocks.push({ type: "h", text: heading });
    } else if (line.startsWith("- ")) {
      if (paragraph.length > 0) flush();
      (list ??= []).push(line.slice(2).trim());
    } else {
      if (list) flush();
      paragraph.push(line.trim());
    }
  }
  flush();
  return blocks;
}

export type KvkkTemplateInput = {
  controller: string;
  address: string;
  email: string;
  phone: string;
  kepAddress: string;
  retention: string;
  recipients: string;
  extra: string;
  effectiveDate: string;
};

export function kvkkTemplateInput(
  settings: {
    siteTitle: string;
    contactAddress: string;
    contactEmail: string;
    contactPhone: string;
  },
  info: KvkkInfo,
): KvkkTemplateInput {
  return {
    controller: info.controllerName || settings.siteTitle,
    address: settings.contactAddress,
    email: settings.contactEmail,
    phone: settings.contactPhone,
    kepAddress: info.kepAddress,
    retention: info.retention || KVKK_DEFAULT_RETENTION,
    recipients: info.recipients || KVKK_DEFAULT_RECIPIENTS,
    extra: info.extra,
    effectiveDate: info.effectiveDate,
  };
}

/** Hazır aydınlatma metni (düz metin). Admin editörü de bu metinle başlar. */
export function buildKvkkTemplate(i: KvkkTemplateInput): string {
  const out: string[] = [];

  out.push(
    "Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 10. maddesi uyarınca, internet sitemizdeki görüşme talebi (iletişim) formunu kullanan kişileri bilgilendirmek için hazırlanmıştır." +
      (i.effectiveDate ? ` Metnin tarihi: ${i.effectiveDate}.` : ""),
    "",
    "## 1. Veri sorumlusu",
    `- Unvan: ${i.controller}`,
    `- Adres: ${i.address}`,
    `- E-posta: ${i.email}`,
    `- Telefon: ${i.phone}`,
  );
  if (i.kepAddress) out.push(`- KEP adresi: ${i.kepAddress}`);

  out.push(
    "",
    "## 2. İşlenen kişisel veriler",
    "Formda yazdığınız ad soyad, e-posta adresi, telefon numarası (isteğe bağlı), ilgilendiğiniz konu, ulaşma ve zaman tercihiniz ile mesajınızın içeriği işlenir. Lütfen mesajınıza kimlik numarası, banka bilgisi veya özel nitelikli kişisel verilerinizi yazmayın.",
    "",
    "Sitenin kötüye kullanımını önlemek için form gönderimi sırasında IP adresiniz kısa süreli olarak sunucu belleğinde tutulur, kalıcı olarak kaydedilmez. Sunucu altyapısı ayrıca teknik erişim kayıtları tutabilir.",
    "",
    "## 3. İşleme amacı",
    "Verileriniz; görüşme talebinize ve mesajınıza yanıt vermek, sizinle iletişim kurmak, görüşme planlamak ve talebinizi takip etmek amacıyla işlenir.",
    "",
    "## 4. Toplama yöntemi ve hukuki sebep",
    "Verileriniz, internet sitesindeki formu doldurmanız yoluyla elektronik ortamda ve otomatik yollarla toplanır; sunucudaki kayıt sisteminde saklanır. Hukuki sebep, Kanun'un 5. maddesinin ikinci fıkrasındaki (c) bendi (bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması) ve (f) bendidir (temel hak ve özgürlüklerinize zarar vermemek kaydıyla veri sorumlusunun meşru menfaati). Bu işleme için açık rızanız istenmez.",
    "",
    "## 5. Verilerin aktarımı",
    i.recipients,
    "",
    "## 6. Saklama süresi",
    i.retention,
    "",
    "## 7. Çerezler",
    "Bu sitede analiz, reklam veya izleme amaçlı çerez kullanılmaz. Yönetim paneline giriş yapılırken oturumun sürdürülmesi için yalnızca yöneticide oluşan teknik bir çerez kullanılır; ziyaretçilerde çerez oluşmaz.",
    "",
    "## 8. Haklarınız",
    "Kanun'un 11. maddesi uyarınca veri sorumlusuna başvurarak şu haklara sahipsiniz:",
    ...KVKK_RIGHTS.map((right) => `- ${right}`),
    "",
    "## 9. Başvuru yöntemi",
    "Başvurunuzda adınız soyadınız, imzanız (yazılı başvuruda), T.C. kimlik numaranız (yabancılar için uyruğu ve pasaport ya da kimlik numarası), tebligata esas yerleşim yeri veya iş yeri adresiniz, varsa e-posta, telefon ve faks bilgileriniz ile talep konunuz yer almalıdır.",
    "",
    "Başvurunuzu şu yollardan iletebilirsiniz:",
    `- Yazılı olarak ${i.address} adresine,`,
    `- Güvenli elektronik imza veya mobil imza ile imzalayarak ya da formda bildirdiğiniz e-posta adresinizden ${i.email} adresine${i.kepAddress ? "," : "."}`,
  );
  if (i.kepAddress) {
    out.push(`- Kayıtlı elektronik posta (KEP) ile ${i.kepAddress} adresine.`);
  }
  out.push(
    "",
    "Başvurunuz, talebin niteliğine göre en kısa sürede ve en geç otuz gün içinde sonuçlandırılır.",
  );

  if (i.extra) {
    out.push("", "## 10. Ek açıklama", i.extra);
  }

  return out.join("\n");
}
