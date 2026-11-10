export type ExternalNewsItem = {
  title: string;
  href: string;
  excerpt: string;
  dateLabel: string;
};

const DEFAULT_NEWS_URL = "https://www.ozcankutlu.com/tr/blog";

function decodeHtml(value: string) {
  return value
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(base: string, path: string) {
  try {
    return new URL(path, base).toString();
  } catch {
    return path;
  }
}

export async function fetchExternalNews(
  sourceUrl = DEFAULT_NEWS_URL,
  limit = 9,
): Promise<ExternalNewsItem[]> {
  const url = sourceUrl.trim() || DEFAULT_NEWS_URL;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent": "Proje1NewsBot/1.0",
        Accept: "text/html",
      },
    });

    if (!response.ok) return [];

    const html = await response.text();
    const cardRegex =
      /<a class="group block h-full" href="([^"]+)">([\s\S]*?)<\/article><\/a>/g;
    const items: ExternalNewsItem[] = [];
    let match: RegExpExecArray | null;

    while ((match = cardRegex.exec(html)) !== null && items.length < limit) {
      const href = absoluteUrl(url, match[1]);
      const block = match[2];
      const titleMatch = block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
      const excerptMatch =
        block.match(/<p class="[^"]*line-clamp[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
        block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      const dateMatch = block.match(
        /(\d{1,2}\s+[A-Za-zçğıöşüÇĞİÖŞÜ]+\s+\d{4})/,
      );

      const title = titleMatch ? decodeHtml(titleMatch[1]) : "";
      if (!title) continue;

      items.push({
        title,
        href,
        excerpt: excerptMatch ? decodeHtml(excerptMatch[1]) : "",
        dateLabel: dateMatch?.[1] ?? "",
      });
    }

    if (items.length > 0) return items;

    // Fallback: collect blog links from sitemap-style anchors
    const linkRegex = /href="((?:https?:\/\/[^"]+)?\/tr\/blog\/[^"]+)"/g;
    const seen = new Set<string>();
    while ((match = linkRegex.exec(html)) !== null && items.length < limit) {
      const href = absoluteUrl(url, match[1]);
      if (seen.has(href) || href.endsWith("/tr/blog")) continue;
      seen.add(href);
      const slug = href.split("/").pop()?.replace(/-/g, " ") ?? "Yazı";
      items.push({
        title: slug.replace(/\b\w/g, (c) => c.toUpperCase()),
        href,
        excerpt: "ozcankutlu.com blog yazısı",
        dateLabel: "",
      });
    }

    return items;
  } catch {
    return [];
  }
}

export { DEFAULT_NEWS_URL };
