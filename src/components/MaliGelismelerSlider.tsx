"use client";

import { useEffect, useState } from "react";
import type { ExternalNewsItem } from "@/lib/external-news";

function CalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function MaliGelismelerSlider({
  items,
  sourceLabel,
  sourceUrl,
}: {
  items: ExternalNewsItem[];
  sourceLabel: string;
  sourceUrl: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="admin-panel">
        <p style={{ margin: 0 }}>
          Güncel mali gelişmeler yüklenemedi. Kaynak: {sourceLabel}
        </p>
      </div>
    );
  }

  const item = items[index];
  const go = (next: number) => {
    setIndex((next + items.length) % items.length);
  };

  const CardInner = (
    <>
      <div className={`mg-card theme-${item.theme}`}>
        <div className="mg-grid" aria-hidden="true" />
        <div className="mg-content">
          <span className="mg-badge">
            <CalendarIcon className="mg-badge-icon" />
            {item.badge}
          </span>
          <h3>{item.title}</h3>
          {item.summary ? <p>{item.summary}</p> : null}
          <div className="mg-meta">
            <CalendarIcon className="mg-meta-icon" />
            <span>
              {item.dateLabel}
              {item.dateLabel && item.source ? " — " : ""}
              {item.source}
            </span>
          </div>
        </div>
        <div className="mg-decor" aria-hidden="true">
          <CalendarIcon />
          <span>!</span>
        </div>
      </div>
    </>
  );

  return (
    <section className="mg-section">
      <div className="mg-header">
        <span className="mg-live-dot" aria-hidden="true" />
        <h2>GÜNCEL MALİ GELİŞMELER</h2>
        <span className="mg-live-pill">CANLI</span>
      </div>

      <div className="mg-slider">
        <button
          type="button"
          className="mg-nav mg-prev"
          aria-label="Önceki"
          onClick={() => go(index - 1)}
        >
          ‹
        </button>

        {item.href ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mg-card-link"
          >
            {CardInner}
          </a>
        ) : (
          <div className="mg-card-link">{CardInner}</div>
        )}

        <button
          type="button"
          className="mg-nav mg-next"
          aria-label="Sonraki"
          onClick={() => go(index + 1)}
        >
          ›
        </button>
      </div>

      <div className="mg-dots" role="tablist" aria-label="Haberler">
        {items.map((entry, i) => (
          <button
            key={entry.id}
            type="button"
            className={i === index ? "is-active" : ""}
            aria-label={`Haber ${i + 1}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>

      <p className="mg-source-note">
        Kaynak:{" "}
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
          {sourceLabel}
        </a>
      </p>
    </section>
  );
}
