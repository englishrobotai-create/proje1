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

const LETTER_RE = /[A-Za-zÀ-ÖØ-öø-ÿĞğİıŞşÜüÇç]/g;
const VOWEL_RE = /[aeıioöuüAEIİOÖUÜ]/g;
const CONSONANT_RUN_RE =
  /[bcdfghjklmnpqrstvwxyzçğşBCDFGHJKLMNPQRSTVWXYZÇĞŞ]{5,}/;

/** Aynı 3–4 harflik parçanın sık tekrarı (asdfasdf, fkdafkda…). */
function hasRepeatedChunk(letters: string): boolean {
  const lower = letters.toLocaleLowerCase("tr-TR");
  if (lower.length < 12) return false;
  for (const size of [3, 4] as const) {
    const counts = new Map<string, number>();
    for (let i = 0; i <= lower.length - size; i++) {
      const chunk = lower.slice(i, i + size);
      counts.set(chunk, (counts.get(chunk) ?? 0) + 1);
    }
    for (const n of counts.values()) {
      if (n >= 3) return true;
    }
  }
  return false;
}

/**
 * Anlamsız / rastgele tuşlama yakalama (AI değil; basit istatistik).
 * Anlamı anlamaz — boşluksuz yığın, düşük sesli oranı, tekrarlayan tuşlar.
 */
export function looksLikeGibberish(text: string): boolean {
  const raw = text.trim();
  if (raw.length < 8) return false;

  const letters = (raw.match(LETTER_RE) ?? []).join("");
  if (letters.length < 8) return false;

  const spaces = (raw.match(/\s/g) ?? []).length;
  const words = raw.split(/\s+/).filter(Boolean);
  const avgWord =
    words.length > 0
      ? words.reduce(
          (sum, w) => sum + ((w.match(LETTER_RE) ?? []).length || w.length),
          0,
        ) / words.length
      : letters.length;

  // Boşluksuz harf yığını (başlık/açıklama tuşlaması)
  if (spaces === 0 && letters.length >= 10) return true;
  // Çok az boşluk + aşırı uzun “kelimeler”
  if (raw.length >= 18 && avgWord >= 12 && words.length <= 3) return true;

  const vowels = (letters.match(VOWEL_RE) ?? []).length;
  const vowelRatio = vowels / letters.length;
  if (letters.length >= 10 && vowelRatio < 0.22) return true;

  if (/(.)\1{3,}/i.test(letters)) return true;

  // Ünsüz zinciri / tekrarlayan hece: boşluksuz yığında veya kelime kelime.
  // Tüm metni birleştirip bakmak “asdfgh” içeren normal cümleyi yanlış anlamsız sayar.
  if (spaces === 0) {
    if (CONSONANT_RUN_RE.test(letters)) return true;
    if (hasRepeatedChunk(letters)) return true;
  } else if (words.length <= 2) {
    if (CONSONANT_RUN_RE.test(letters)) return true;
    if (hasRepeatedChunk(letters)) return true;
  } else {
    const letterWords = words
      .map((w) => (w.match(LETTER_RE) ?? []).join(""))
      .filter((w) => w.length >= 4);
    if (letterWords.length >= 3) {
      const badWords = letterWords.filter(
        (w) =>
          CONSONANT_RUN_RE.test(w) ||
          (w.length >= 6 &&
            ((w.match(VOWEL_RE) ?? []).length) / w.length < 0.2),
      );
      if (badWords.length / letterWords.length >= 0.5) return true;
    }
  }

  // Kısa metinde gerçekten çok az farklı harf (uzun cümlede oran doğal düşer)
  const unique = new Set(letters.toLocaleLowerCase("tr-TR")).size;
  if (letters.length >= 10 && letters.length <= 40 && unique <= 5) return true;

  return false;
}

function scoreFrom(items: SeoCheckItem[]): number {
  let score = 100;
  let hasGibberish = false;
  for (const item of items) {
    if (item.id.includes("gibberish")) {
      hasGibberish = true;
      score -= 40;
    } else if (item.level === "bad") score -= 22;
    else if (item.level === "warn") score -= 8;
  }
  if (hasGibberish) score = Math.min(score, 35);
  return Math.max(0, Math.min(100, score));
}

function pushGibberish(
  items: SeoCheckItem[],
  id: string,
  label: string,
  text: string,
): boolean {
  if (!looksLikeGibberish(text)) return false;
  push(
    items,
    id,
    "bad",
    label,
    "Metin okunaklı bir cümle gibi görünmüyor (rastgele harf yığını / boşluksuz yazı). Anlamlı Türkçe yazın.",
  );
  return true;
}

const WORD_TOKEN_RE =
  /[A-Za-zÀ-ÖØ-öø-ÿĞğİıŞşÜüÇç]{4,}/g;
const WORD_CONSONANT_RUN_RE =
  /[bcdfghjklmnpqrstvwxyzçğşBCDFGHJKLMNPQRSTVWXYZÇĞŞ]{4,}/;

/** Tek kelime: yazım / tuş hatası gibi duruyor mu (sözlük yok; hece istatistiği). */
export function wordLooksMisspelled(word: string): boolean {
  const w = word.trim();
  if (w.length < 4) return false;
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿĞğİıŞşÜüÇç]+$/.test(w)) return false;

  const vowels = (w.match(VOWEL_RE) ?? []).length;
  if (vowels === 0) return true;
  if (w.length >= 6 && vowels / w.length < 0.2) return true;
  if (WORD_CONSONANT_RUN_RE.test(w)) return true;
  // Türkçede çift harf olur (ss, ll); üçlü tekrar tipik yazım/tuş hatası
  if (/(.)\1{2,}/i.test(w)) return true;
  // Çok uzun tek hece yığını (boşluksuz bileşik değilse şüpheli)
  if (w.length >= 16 && vowels / w.length < 0.28) return true;

  return false;
}

/**
 * Metindeki şüpheli kelimeleri bulur (en fazla `limit` örnek).
 * Markdown / URL parçalarını kabaca eler.
 */
export function findSuspiciousWords(
  text: string,
  limit = 5,
): string[] {
  const clean = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[#*_`>|]/g, " ");

  const found: string[] = [];
  const seen = new Set<string>();
  for (const match of clean.matchAll(WORD_TOKEN_RE)) {
    const word = match[0];
    const key = word.toLocaleLowerCase("tr-TR");
    if (seen.has(key)) continue;
    if (!wordLooksMisspelled(word)) continue;
    seen.add(key);
    found.push(word);
    if (found.length >= limit) break;
  }
  return found;
}

function pushSpellingWarn(
  items: SeoCheckItem[],
  id: string,
  label: string,
  text: string,
): boolean {
  if (!text.trim() || looksLikeGibberish(text)) return false;
  const bad = findSuspiciousWords(text, 5);
  if (bad.length === 0) return false;
  const examples = bad.map((w) => `“${w}”`).join(", ");
  push(
    items,
    id,
    "warn",
    label,
    `Yazım şüphesi: ${examples}. Gözden geçirin (otomatik sözlük değil; hece/tuş kontrolü).`,
  );
  return true;
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
  const seoTitleRaw = input.seoTitle.trim();
  const seoDescRaw = input.seoDescription.trim();
  const seoTitle = seoTitleRaw || title;
  const seoDescription = seoDescRaw || excerpt;
  const words = countWords(content);

  const titleGibberish = pushGibberish(
    items,
    "title-gibberish",
    "Başlık anlamsız",
    title,
  );
  if (!titleGibberish) {
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
    pushSpellingWarn(items, "title-spelling", "Başlık yazımı", title);
  }

  const excerptGibberish = pushGibberish(
    items,
    "excerpt-gibberish",
    "Özet anlamsız",
    excerpt,
  );
  if (!excerptGibberish) {
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
    pushSpellingWarn(items, "excerpt-spelling", "Özet yazımı", excerpt);
  }

  const contentGibberish = pushGibberish(
    items,
    "content-gibberish",
    "İçerik anlamsız",
    content.slice(0, 800),
  );
  if (!contentGibberish) {
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

    pushSpellingWarn(
      items,
      "content-spelling",
      "İçerik yazımı",
      content.slice(0, 4000),
    );
  }

  if (seoTitleRaw) {
    const seoTitleGib = pushGibberish(
      items,
      "seo-title-gibberish",
      "SEO başlığı anlamsız",
      seoTitleRaw,
    );
    if (!seoTitleGib) {
      if (seoTitle.length > 60) {
        push(
          items,
          "seo-title",
          "warn",
          "SEO başlığı",
          `Yaklaşık ${seoTitle.length} karakter; Google’da ~60 civarı kesilir. Kısaltmayı düşünün.`,
        );
      } else {
        push(items, "seo-title-ok", "ok", "SEO başlığı", `${seoTitle.length} karakter.`);
      }
      pushSpellingWarn(items, "seo-title-spelling", "SEO başlığı yazımı", seoTitleRaw);
    }
  } else {
    push(
      items,
      "seo-title-empty",
      "warn",
      "SEO başlığı boş",
      "Boşsa yazı başlığı kullanılır. İsterseniz arama için ayrı, daha net bir SEO başlığı yazın.",
    );
  }

  if (seoDescRaw) {
    const seoDescGib = pushGibberish(
      items,
      "seo-desc-gibberish",
      "SEO açıklaması anlamsız",
      seoDescRaw,
    );
    if (!seoDescGib) {
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
      pushSpellingWarn(
        items,
        "seo-desc-spelling",
        "SEO açıklaması yazımı",
        seoDescRaw,
      );
    }
  } else if (seoDescription.length < 70) {
    push(
      items,
      "seo-desc-short",
      "warn",
      "SEO açıklaması kısa",
      "Arama özetinde ~120–160 karakter daha iyi tıklanma sağlar. Ana fikri ilk cümleye koyun.",
    );
  } else {
    push(
      items,
      "seo-desc",
      "ok",
      "SEO açıklaması",
      `${seoDescription.length} karakter — özetten kullanılıyor.`,
    );
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

  const titleGibberish = pushGibberish(
    items,
    "svc-title-gibberish",
    "Başlık anlamsız",
    title,
  );
  if (!titleGibberish) {
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
    pushSpellingWarn(items, "svc-title-spelling", "Başlık yazımı", title);
  }

  const descGibberish = pushGibberish(
    items,
    "svc-desc-gibberish",
    "Açıklama anlamsız",
    description,
  );
  if (!descGibberish) {
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
    pushSpellingWarn(items, "svc-desc-spelling", "Açıklama yazımı", description);
  }

  const generic =
    /^(hizmet|danışmanlık|muhasebe|vergi)\s*$/i.test(title) ||
    description.length < 40;
  if (!titleGibberish && generic && title.length < 15) {
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

  const introGibberish = pushGibberish(
    items,
    "intro-gibberish",
    "Sayfa açıklaması anlamsız",
    intro,
  );
  if (!introGibberish) {
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
    pushSpellingWarn(items, "intro-spelling", "Sayfa açıklaması yazımı", intro);
  }

  return { score: scoreFrom(items), items };
}
