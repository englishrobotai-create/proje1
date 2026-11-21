"use client";

import type { SeoCheckResult } from "@/lib/seo-check";

export function SeoCheckPanel({ result }: { result: SeoCheckResult | null }) {
  if (!result) return null;

  const tone =
    result.score >= 80 ? "ok" : result.score >= 55 ? "warn" : "bad";

  return (
    <div className={`seo-check seo-check-${tone}`} role="status">
      <div className="seo-check-head">
        <strong>SEO kontrolü</strong>
        <span className="seo-check-score">Puan: {result.score}/100</span>
      </div>
      <p className="seo-check-note">
        Uzunluk ve yapı kontrolüdür; metnin anlamını okumaz. Anlamsız tuşlama düşük
        puan alır. Google sıralaması garantisi değildir.
      </p>
      <ul className="seo-check-list">
        {result.items.map((item) => (
          <li key={item.id} className={`seo-check-item level-${item.level}`}>
            <span className="seo-check-badge">
              {item.level === "ok"
                ? "Tamam"
                : item.level === "warn"
                  ? "Uyarı"
                  : item.id.includes("gibberish")
                    ? "Sorun"
                    : "Eksik"}
            </span>
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
