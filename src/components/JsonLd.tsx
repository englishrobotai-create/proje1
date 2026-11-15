/**
 * schema.org yapılandırılmış verisini <script type="application/ld+json"> olarak yazar.
 * "<" karakteri, Next.js belgelerindeki önerilen şekilde kaçırılır (XSS'e karşı).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
