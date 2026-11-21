/**
 * Admin formlarında “SEO kontrolü” (kaydetmez; yalnızca uyarı listesi üretir).
 * Blob / görsel yok — sadece metin alanlarına bakar.
 */

export type SeoLevel = "ok" | "warn" | "bad";

export type SeoCheckItem = {
  id: string;
  level: SeoLevel;
  label: string;
  detail: string;
};

export type SeoCheckResult = {
  /** 0–100; uyarılar ve hatalara göre düşer. */
  score: number;
  items: SeoCheckItem[];
};

function push(
  items: SeoCheckItem[],
  id: string,
  level: SeoLevel,
  label: string,
  detail: string,
) {
  items.push({ id, level, label, detail });
}

/** Kabaca kelime sayısı (markdown işaretleri temizlenir). */
export function countWords(text: string): number {
  const clean = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_`\[\]()>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return 0;
  return clean.split(" ").filter(Boolean).length;
}

function hasHeading(content: string): boolean {
  return /^#{2,3}\s+\S+/m.test(content);
}

function hasInternalLink(content: string): boolean {
  return /\[[^\]]+\]\(\/(?!\/)[^)\s]*\)/.test(content);
}

function scoreFrom(items: SeoCheckItem[]): number {
  let score = 100;
  for (const item of items) {
    if (item.level === "bad") score -= 18;
    else if (item.level === "warn") score -= 8;
  }
  return Math.max(0, Math.min(100, score));
}

export type BlogSeoInput = {
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  authorName: string;
};

export function checkBlogSeo(input: BlogSeoInput): SeoCheckResult {
  const items: SeoCheckItem[] = [];
  const title = input.title.trim();
  const excerpt = input.excerpt.trim();
  const content = input.content.trim();
  const slug = input.slug.trim();
  const seoTitle = input.seoTitle.trim() || title;
  const seoDescription = input.seoDescription.trim() || excerpt;
  const words = countWords(content);

  if (title.length < 20) {
    push(
      items,
      "title-short",
      "bad",
      "Başlık kısa",
      "Aranan konuyu net yazın (öneri: en az ~20 karakter, örn. “Limited şirket kuruluş maliyeti”).",
    );
  } else if (title.length > 70) {
    push(
      items,
      "title-long",
      "warn",
      "Başlık uzun",
      "Çok uzun başlıklar arama sonucunda kesilebilir; 50–65 karakter idealdir.",
    );
  } else {
    push(items, "title", "ok", "Başlık", `${title.length} karakter — uygun görünüyor.`);
  }

  if (seoTitle.length > 60) {
    push(
      items,
      "seo-title",
      "warn",
      "SEO başlığı",
      `Yaklaşık ${seoTitle.length} karakter; Google’da ~60 civarı kesilir. Kısaltmayı düşünün.`,
    );
  } else if (!input.seoTitle.trim()) {
    push(
      items,
      "seo-title-empty",
      "warn",
      "SEO başlığı boş",
      "Boşsa yazı başlığı kullanılır. İsterseniz arama için ayrı, daha net bir SEO başlığı yazın.",
    );
  } else {
    push(items, "seo-title-ok", "ok", "SEO başlığı", `${seoTitle.length} karakter.`);
  }

  if (seoDescription.length < 70) {
    push(
      items,
      "seo-desc-short",
      "warn",
      "SEO açıklaması kısa",
      "Arama özetinde ~120–160 karakter daha iyi tıklanma sağlar. Ana fikri ilk cümleye koyun.",
    );
  } else if (seoDescription.length > 160) {
    push(
      items,
      "seo-desc-long",
      "warn",
      "SEO açıklaması uzun",
      "160 karakterden sonrası genelde görünmez; kısaltın.",
    );
  } else {
    push(
      items,
      "seo-desc",
      "ok",
      "SEO açıklaması",
      `${seoDescription.length} karakter — uygun aralık.`,
    );
  }

  if (excerpt.length < 40) {
    push(
      items,
      "excerpt",
      "warn",
      "Özet kısa",
      "Liste ve meta için özetin ilk cümlesinde ana vaadi yazın.",
    );
  } else {
    push(items, "excerpt-ok", "ok", "Özet", "Özet alanı dolu.");
  }

  if (words < 300) {
    push(
      items,
      "words-low",
      "bad",
      "İçerik kısa",
      `Yaklaşık ${words} kelime. İnce içerik riski yüksek; 400+ kelime ve ara başlıklar önerilir.`,
    );
  } else if (words < 500) {
    push(
      items,
      "words-mid",
      "warn",
      "İçerik orta",
      `Yaklaşık ${words} kelime. Konuya göre 600–1200 kelime daha güvenli olabilir.`,
    );
  } else {
    push(items, "words", "ok", "İçerik uzunluğu", `Yaklaşık ${words} kelime.`);
  }

  if (!hasHeading(content)) {
    push(
      items,
      "headings",
      "warn",
      "Ara başlık yok",
      "Uzun yazıda `##` ve `###` ara başlıklar okuyucuya ve arama motoruna yol gösterir.",
    );
  } else {
    push(items, "headings-ok", "ok", "Ara başlıklar", "`##` / `###` kullanılmış.");
  }

  if (!hasInternalLink(content)) {
    push(
      items,
      "links",
      "warn",
      "İç bağlantı yok",
      "Örn. `[iletişim](/iletisim)` veya ilgili hizmet sayfasına link ekleyin.",
    );
  } else {
    push(items, "links-ok", "ok", "İç bağlantı", "Sayfa içi bağlantı bulunuyor.");
  }

  if (slug && slug.length > 80) {
    push(
      items,
      "slug-long",
      "warn",
      "Adres uzun",
      "Slug’ı kısa ve okunaklı tutun (konu kelimeleri yeterli).",
    );
  } else if (slug) {
    push(items, "slug", "ok", "Adres (slug)", "Adres alanı dolu.");
  } else {
    push(
      items,
      "slug-empty",
      "ok",
      "Adres (slug)",
      "Boşsa başlıktan üretilecek; yayın sonrası gereksiz yere değiştirmeyin.",
    );
  }

  if (!input.authorName.trim()) {
    push(
      items,
      "author",
      "warn",
      "Yazar boş",
      "Boşsa ofis adı kullanılır. Gerçek SMMM adını yazmak güven (E-E-A-T) için daha iyi.",
    );
  } else {
    push(items, "author-ok", "ok", "Yazar", "Yazar adı yazılmış.");
  }

  return { score: scoreFrom(items), items };
}

export type ServiceSeoInput = {
  title: string;
  description: string;
};

export function checkServiceSeo(input: ServiceSeoInput): SeoCheckResult {
  const items: SeoCheckItem[] = [];
  const title = input.title.trim();
  const description = input.description.trim();
  const words = countWords(description);

  if (title.length < 8) {
    push(
      items,
      "svc-title-short",
      "bad",
      "Başlık kısa",
      "Hizmeti aranan ifadeyle yazın (örn. “Şirket kuruluşu ve ana sözleşme”).",
    );
  } else if (title.length > 60) {
    push(
      items,
      "svc-title-long",
      "warn",
      "Başlık uzun",
      "Kartlarda kesilebilir; 20–50 karakter daha okunaklıdır.",
    );
  } else {
    push(items, "svc-title", "ok", "Hizmet başlığı", `${title.length} karakter.`);
  }

  if (description.length < 80) {
    push(
      items,
      "svc-desc-short",
      "bad",
      "Açıklama kısa",
      "Kimler için, ne kapsar, nasıl ilerlersiniz — 2–3 cümle yazın (öneri: 120–300 karakter).",
    );
  } else if (description.length > 350) {
    push(
      items,
      "svc-desc-long",
      "warn",
      "Açıklama uzun",
      "Kart metni 400 karaktere kadar; çok uzunsa okunması zorlaşır.",
    );
  } else {
    push(
      items,
      "svc-desc",
      "ok",
      "Açıklama",
      `${description.length} karakter · ~${words} kelime.`,
    );
  }

  if (!/[.!?…]/.test(description)) {
    push(
      items,
      "svc-sentence",
      "warn",
      "Cümle yapısı",
      "Açıklamayı en az bir tam cümle olarak bitirin; şema ve okunabilirlik için iyi olur.",
    );
  }

  const generic =
    /^(hizmet|danışmanlık|muhasebe|vergi)\s*$/i.test(title) ||
    description.length < 40;
  if (generic && title.length < 15) {
    push(
      items,
      "svc-generic",
      "warn",
      "Çok genel ifade",
      "“Muhasebe” yerine somut hizmet adı kullanın; arama ve LLM alıntısı için daha iyidir.",
    );
  }

  return { score: scoreFrom(items), items };
}

export type ServicesIntroSeoInput = {
  intro: string;
};

/** Hizmetler sayfasının üst açıklaması (sayfa meta description kaynağı). */
export function checkServicesIntroSeo(
  input: ServicesIntroSeoInput,
): SeoCheckResult {
  const items: SeoCheckItem[] = [];
  const intro = input.intro.trim();

  if (intro.length < 70) {
    push(
      items,
      "intro-short",
      "bad",
      "Sayfa açıklaması kısa",
      "Bu metin Hizmetler sayfasının SEO açıklamasında da kullanılır; ~120–160 karakter önerilir.",
    );
  } else if (intro.length > 160) {
    push(
      items,
      "intro-long",
      "warn",
      "Sayfa açıklaması uzun",
      "Arama özetinde ~160 karakter görünür; fazlası kesilebilir. İlk cümleye ana vaadi koyun.",
    );
  } else {
    push(
      items,
      "intro",
      "ok",
      "Sayfa açıklaması",
      `${intro.length} karakter — meta açıklama için uygun aralık.`,
    );
  }

  if (!/[.!?…]/.test(intro)) {
    push(
      items,
      "intro-sentence",
      "warn",
      "Cümle",
      "Açıklamayı tam cümle(ler) olarak yazın.",
    );
  }

  return { score: scoreFrom(items), items };
}
