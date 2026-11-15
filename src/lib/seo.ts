import type { Metadata } from "next";
import { getActiveSocialLinks, type SiteSettings } from "./settings";

const LOCAL_URL = "http://localhost:3000";

// settings.ts içindeki varsayılan (yer tutucu) iletişim değerleri.
// Bunlar gerçek bilgi değil; arama motorlarına / yapay zekâya verilmemeli.
const PLACEHOLDER_EMAIL = "info@ornek-mm.com";
const PLACEHOLDER_PHONE = "+90 (212) 000 00 00";
const PLACEHOLDER_ADDRESS = "İstanbul, Türkiye";

/**
 * Sitenin kök adresi. Her müşteri kopyasının .env dosyasındaki SITE_URL'den gelir
 * (örn. https://musteri-alanadi.com). Üretimde tanımlı değilse null döner; bu durumda
 * canonical, sitemap ve şema adresleri üretilmez (yanlış adres yayınlamaktan iyidir).
 */
export function getSiteUrl(): string | null {
  const raw = process.env.SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw.includes("://") ? raw : `https://${raw}`).origin;
    } catch {
      // geçersiz değer: aşağıdaki varsayılana düş
    }
  }
  return process.env.NODE_ENV === "production" ? null : LOCAL_URL;
}

export function absoluteUrl(path: string): string | null {
  const base = getSiteUrl();
  return base ? new URL(path, base).toString() : null;
}

/** Metni kelime sınırında kısaltır (meta description için). */
export function clip(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

type PageMetaOptions = {
  title: string;
  description: string;
  path: string;
  article?: { publishedTime: string; modifiedTime: string };
  /** Paylaşım görselinin adresi (yoksa sitenin genel görseli /og kullanılır). */
  image?: string | null;
  /** Blog RSS beslemesini sayfaya tanıtır (<link rel="alternate">). */
  feed?: boolean;
};

/** Sitenin genel paylaşım görseli (src/app/og). SITE_URL bilinmiyorsa null. */
export function defaultOgImage(): string | null {
  return absoluteUrl("/og");
}

/** Sayfa başına title, description, canonical, Open Graph ve Twitter etiketleri. */
export function pageMetadata(
  settings: Pick<SiteSettings, "siteTitle">,
  { title, description, path, article, image, feed }: PageMetaOptions,
): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = `${title} | ${settings.siteTitle}`;
  const text = clip(description);
  const imageUrl = image === undefined ? defaultOgImage() : image;
  const images = imageUrl
    ? [{ url: imageUrl, width: 1200, height: 630, alt: title }]
    : undefined;
  const feedUrl = feed ? absoluteUrl("/blog/feed.xml") : null;
  const common = {
    locale: "tr_TR",
    siteName: settings.siteTitle,
    title: fullTitle,
    description: text,
    ...(url ? { url } : {}),
    ...(images ? { images } : {}),
  };

  return {
    title,
    description: text,
    ...(url
      ? {
          alternates: {
            canonical: url,
            ...(feedUrl ? { types: { "application/rss+xml": feedUrl } } : {}),
          },
        }
      : {}),
    openGraph: article
      ? { type: "article", ...common, ...article }
      : { type: "website", ...common },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: fullTitle,
      description: text,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

type JsonObject = Record<string, unknown>;

/** Ofisin kimlik düğümüne referans (@id varsa onu, yoksa adı kullanır). */
export function organizationRef(settings: SiteSettings): JsonObject {
  const base = getSiteUrl();
  // Ad her durumda yazılır: arama motorları başka bir betikteki @id düğümünü her zaman çözmez.
  return base
    ? {
        "@type": "AccountingService",
        "@id": `${base}/#organization`,
        name: settings.siteTitle,
      }
    : { "@type": "AccountingService", name: settings.siteTitle };
}

/** Ana ofis kimliği + web sitesi düğümü (schema.org). Yalnızca gerçek ayar verisi kullanılır. */
export function buildSiteGraph(settings: SiteSettings): JsonObject {
  const base = getSiteUrl();
  const email = settings.contactEmail.trim();
  const phone = settings.contactPhone.trim();
  const address = settings.contactAddress.trim();
  // WhatsApp bir profil sayfası olmadığı için sameAs'a girmez.
  const sameAs = getActiveSocialLinks(settings)
    .filter((item) => item.key !== "whatsapp")
    .map((item) => item.href.trim());

  const organization: JsonObject = {
    "@type": "AccountingService",
    ...(base ? { "@id": `${base}/#organization`, url: base } : {}),
    name: settings.siteTitle,
    description: clip(settings.aboutIntro, 300),
    ...(base ? { logo: `${base}/smmm.png`, image: `${base}/smmm.png` } : {}),
    ...(email && email !== PLACEHOLDER_EMAIL ? { email } : {}),
    ...(phone && phone !== PLACEHOLDER_PHONE ? { telephone: phone } : {}),
    ...(address && address !== PLACEHOLDER_ADDRESS
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: address,
            addressCountry: "TR",
          },
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const graph: JsonObject[] = [organization];

  if (base) {
    graph.push({
      "@type": "WebSite",
      "@id": `${base}/#website`,
      url: base,
      name: settings.siteTitle,
      inLanguage: "tr",
      publisher: { "@id": `${base}/#organization` },
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
