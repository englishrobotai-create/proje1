/**
 * Blog yazısı içeriği için hafif biçimlendirme. Saf (bağımlılıksız) modül: hem sayfada
 * hem testlerde kullanılır. HTML üretmez; bileşen düğümleri bu veriden kurar, bu yüzden
 * yazıya yazılan HTML etiketleri düz metin olarak görünür.
 *
 *   ## Başlık            -> H2
 *   ### Alt başlık       -> H3
 *   - madde              -> madde işaretli liste (ardışık satırlar)
 *   1. madde             -> numaralı liste
 *   **kalın**            -> kalın yazı
 *   [metin](adres)       -> bağlantı (https://, http://, /sayfa, mailto:, tel:, #bölüm)
 *
 * Diğer her dolu satır ayrı bir paragraftır (eski yazılarla aynı davranış).
 */

export type Inline =
  | { t: "text"; v: string }
  | { t: "bold"; v: string }
  | { t: "link"; v: string; href: string };

export type Block =
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "p"; inline: Inline[] }
  | { t: "ul"; items: Inline[][] }
  | { t: "ol"; items: Inline[][] };

/** Yalnızca güvenli adres türleri bağlantı olur (javascript:, data: vb. reddedilir). */
export function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (/^https?:\/\/[^\s]+$/i.test(href)) return href;
  if (/^\/(?!\/)[^\s]*$/.test(href)) return href;
  if (/^#[^\s]+$/.test(href)) return href;
  if (/^mailto:[^\s]+$/i.test(href)) return href;
  if (/^tel:[+0-9()\-.\s]+$/i.test(href)) return href;
  return null;
}

const INLINE = /\*\*([^*\n]+?)\*\*|\[([^\]\n]+?)\]\(([^)\n]+?)\)/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) out.push({ t: "text", v: text.slice(last, index) });
    if (match[1] !== undefined) {
      out.push({ t: "bold", v: match[1] });
    } else {
      const href = safeHref(match[3]);
      if (href) out.push({ t: "link", v: match[2], href });
      else out.push({ t: "text", v: match[0] }); // güvenli değilse düz metin kalır
    }
    last = index + match[0].length;
  }
  if (last < text.length) out.push({ t: "text", v: text.slice(last) });
  return out;
}

export function parsePostContent(content: string): Block[] {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const h3 = /^###\s+(.+)$/.exec(line);
    if (h3) {
      blocks.push({ t: "h3", text: h3[1].trim() });
      continue;
    }
    const h2 = /^##\s+(.+)$/.exec(line);
    if (h2) {
      blocks.push({ t: "h2", text: h2[1].trim() });
      continue;
    }

    const ul = /^[-*]\s+(.+)$/.exec(line);
    if (ul) {
      const prev = blocks[blocks.length - 1];
      const inline = parseInline(ul[1].trim());
      if (prev && prev.t === "ul") prev.items.push(inline);
      else blocks.push({ t: "ul", items: [inline] });
      continue;
    }

    const ol = /^\d{1,3}[.)]\s+(.+)$/.exec(line);
    if (ol) {
      const prev = blocks[blocks.length - 1];
      const inline = parseInline(ol[1].trim());
      if (prev && prev.t === "ol") prev.items.push(inline);
      else blocks.push({ t: "ol", items: [inline] });
      continue;
    }

    blocks.push({ t: "p", inline: parseInline(line) });
  }

  return blocks;
}

function inlineText(inline: Inline[]): string {
  return inline.map((part) => part.v).join("");
}

/** Biçim işaretleri olmadan düz metin (kelime sayısı için). */
export function blocksToText(blocks: Block[]): string {
  return blocks
    .map((block) => {
      if (block.t === "h2" || block.t === "h3") return block.text;
      if (block.t === "p") return inlineText(block.inline);
      return block.items.map(inlineText).join(" ");
    })
    .join(" ");
}

export function countWords(blocks: Block[]): number {
  const text = blocksToText(blocks).trim();
  return text ? text.split(/\s+/).length : 0;
}
