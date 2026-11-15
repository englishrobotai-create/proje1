import { formatPostDate, listPublishedPosts, publishDate } from "@/lib/posts";
import { getSiteUrl } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

// Yeni yazılar beklemeden beslemeye girsin.
export const dynamic = "force-dynamic";

/** XML'de geçersiz kontrol karakterlerini atar, özel karakterleri kaçırır. */
function esc(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const base = getSiteUrl();
  if (!base) return new Response("Bulunamadı", { status: 404 });

  const [settings, posts] = await Promise.all([
    getSiteSettings(),
    listPublishedPosts({ take: 30 }),
  ]);

  const items = posts
    .map((post) => {
      const link = `${base}/blog/${post.slug}`;
      return [
        "    <item>",
        `      <title>${esc(post.title)}</title>`,
        `      <link>${esc(link)}</link>`,
        `      <guid isPermaLink="true">${esc(link)}</guid>`,
        `      <pubDate>${publishDate(post).toUTCString()}</pubDate>`,
        `      <description>${esc(post.excerpt)}</description>`,
        post.authorName ? `      <dc:creator>${esc(post.authorName)}</dc:creator>` : null,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const newest = posts[0] ? publishDate(posts[0]) : null;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(`${settings.siteTitle} — Blog`)}</title>
    <link>${esc(`${base}/blog`)}</link>
    <description>Vergi, muhasebe ve işletme yönetimi üzerine güncel yazılar.</description>
    <language>tr</language>
${newest ? `    <lastBuildDate>${newest.toUTCString()}</lastBuildDate>\n` : ""}    <atom:link href="${esc(`${base}/blog/feed.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
