import Link from "next/link";
import type { Block, Inline } from "@/lib/post-content";

/** Mutlak adres sitenin kendisine aitse (aynı köken) iç bağlantı sayılır. */
function toInternalPath(href: string, siteOrigin: string | null): string | null {
  if (href.startsWith("/") || href.startsWith("#")) return href;
  if (!siteOrigin) return null;
  try {
    const url = new URL(href);
    return url.origin === siteOrigin
      ? `${url.pathname}${url.search}${url.hash}`
      : null;
  } catch {
    return null;
  }
}

function renderInline(parts: Inline[], siteOrigin: string | null) {
  return parts.map((part, index) => {
    if (part.t === "text") return part.v;
    if (part.t === "bold") return <strong key={index}>{part.v}</strong>;

    const internal = toInternalPath(part.href, siteOrigin);
    if (internal !== null && internal.startsWith("/")) {
      return (
        <Link key={index} href={internal}>
          {part.v}
        </Link>
      );
    }
    if (part.href.startsWith("#") || part.href.startsWith("mailto:") || part.href.startsWith("tel:")) {
      return (
        <a key={index} href={part.href}>
          {part.v}
        </a>
      );
    }
    return (
      <a key={index} href={part.href} target="_blank" rel="noopener noreferrer">
        {part.v}
      </a>
    );
  });
}

export function PostContent({
  blocks,
  siteOrigin,
}: {
  blocks: Block[];
  siteOrigin: string | null;
}) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.t) {
          case "h2":
            return <h2 key={index}>{block.text}</h2>;
          case "h3":
            return <h3 key={index}>{block.text}</h3>;
          case "ul":
            return (
              <ul key={index}>
                {block.items.map((item, i) => (
                  <li key={i}>{renderInline(item, siteOrigin)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={index}>
                {block.items.map((item, i) => (
                  <li key={i}>{renderInline(item, siteOrigin)}</li>
                ))}
              </ol>
            );
          default:
            return <p key={index}>{renderInline(block.inline, siteOrigin)}</p>;
        }
      })}
    </>
  );
}
