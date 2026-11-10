"use client";

import { useEffect, useState } from "react";
import type { ExternalNewsItem } from "@/lib/external-news";

function CalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 3.5v4M16 3.5v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M14.5 6L9 12l5.5 6" : "M9.5 6L15 12l-5.5 6"}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function themeClass(theme: string) {
  const value = theme.toLowerCase().trim();
  if (["navy", "blue", "indigo"].includes(value)) return "theme-navy";
  if (["emerald", "green", "teal"].includes(value)) return "theme-emerald";
  if (["amber", "gold", "yellow"].includes(value)) return "theme-amber";
  return "theme-crimson";
}

function shorten(text: string, max = 140) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function MaliGelismelerSlider({ items }: { items: ExternalNewsItem[] }) {
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
        <p style={{ margin: 0 }}>Güncel mali gelişmeler şu an yüklenemedi.</p>
      </div>
    );
  }

  const item = items[index];
  const go = (next: number) => {
    setIndex((next + items.length) % items.length);
  };

  const card = (
    <div className={`mg-card ${themeClass(item.theme)}`}>
      <div className="mg-grid" aria-hidden="true" />
      <div className="mg-content">
        <span className="mg-badge">
          <CalendarIcon className="mg-badge-icon" />
          {item.badge}
        </span>
        <h3 title={item.title}>{shorten(item.title, 90)}</h3>
        {item.summary ? (
          <p title={item.summary}>{shorten(item.summary, 150)}</p>
        ) : null}
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
          <ChevronIcon direction="left" />
        </button>

        {item.href ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mg-card-link"
          >
            {card}
          </a>
        ) : (
          <div className="mg-card-link">{card}</div>
        )}

        <button
          type="button"
          className="mg-nav mg-next"
          aria-label="Sonraki"
          onClick={() => go(index + 1)}
        >
          <ChevronIcon direction="right" />
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
    </section>
  );
}
