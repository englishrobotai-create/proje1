export type ExternalNewsItem = {
  id: string;
  title: string;
  summary: string;
  dateLabel: string;
  source: string;
  href: string;
  kind: string;
  theme: string;
  badge: string;
};

const DEFAULT_NEWS_URL = "https://www.ozcankutlu.com/api/news";

type ApiNewsItem = {
  id?: string;
  title?: string;
  summary?: string;
  analysis?: string;
  primarySource?: string;
  primaryUrl?: string;
  effectiveDate?: string;
  publishedAt?: string;
  kind?: string;
  visualTheme?: string;
  disableSourceLink?: boolean;
  sources?: Array<{ name?: string; url?: string }>;
};

type ApiNewsResponse = {
  success?: boolean;
  data?: ApiNewsItem[];
};

function formatDateLabel(value?: string) {
  if (!value) return "";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function badgeFor(kind?: string) {
  if (kind === "deadline") return "SON TARİH";
  if (kind === "alert") return "UYARI";
  return "GÜNCEL";
}

export async function fetchExternalNews(
  sourceUrl = DEFAULT_NEWS_URL,
  limit = 20,
): Promise<ExternalNewsItem[]> {
  const url = sourceUrl.trim() || DEFAULT_NEWS_URL;

  try {
    const response = await fetch(url, {
      next: { revalidate: 1800 },
      headers: {
        Accept: "application/json",
        "User-Agent": "Proje1NewsBot/1.0",
      },
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as ApiNewsResponse;
    const rows = Array.isArray(payload.data) ? payload.data : [];

    return rows.slice(0, limit).map((item, index) => {
      const href =
        item.disableSourceLink
          ? ""
          : item.primaryUrl || item.sources?.[0]?.url || "";

      return {
        id: item.id || `news-${index}`,
        title: item.title?.trim() || "Güncel mali gelişme",
        summary: (item.summary || item.analysis || "").trim(),
        dateLabel: formatDateLabel(item.effectiveDate || item.publishedAt),
        source: item.primarySource || item.sources?.[0]?.name || "Resmi kaynak",
        href,
        kind: item.kind || "news",
        theme: item.visualTheme || "crimson",
        badge: badgeFor(item.kind),
      };
    });
  } catch {
    return [];
  }
}

export { DEFAULT_NEWS_URL };
