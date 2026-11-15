"use client";

import { useEffect, useState } from "react";
import type { ExternalNewsItem } from "@/lib/external-news";

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
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  if (items.length === 0) return null;

  const item = items[index] ?? items[0];
  const go = (next: number) => {
    setIndex((next + items.length) % items.length);
  };

  const card = (
    <div className={`mg-card ${themeClass(item.theme)}`}>
      <span className="mg-badge">{item.badge}</span>
      <span className="mg-text">
        <strong className="mg-title" title={item.title}>
          {shorten(item.title, 110)}
        </strong>
        {item.summary ? (
          <span className="mg-summary" title={item.summary}>
            {shorten(item.summary, 160)}
          </span>
        ) : null}
      </span>
      <span className="mg-meta">
        {item.dateLabel}
        {item.dateLabel && item.source ? " — " : ""}
        {item.source}
      </span>
    </div>
  );

  return (
    <section
      className="mg-section"
      aria-label="Güncel mali gelişmeler"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mg-bar">
        <h2 className="mg-label">Güncel mali gelişmeler</h2>

        <div className="mg-viewport">
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
        </div>

        {items.length > 1 ? (
          <div className="mg-controls">
            <button
              type="button"
              className="mg-nav"
              aria-label="Önceki haber"
              onClick={() => go(index - 1)}
            >
              <ChevronIcon direction="left" />
            </button>

            <div className="mg-dots" role="group" aria-label="Haber seçimi">
              {items.map((entry, i) => (
                <button
                  key={entry.id}
                  type="button"
                  className={i === index ? "is-active" : ""}
                  aria-label={`Haber ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>

            <button
              type="button"
              className="mg-nav"
              aria-label="Sonraki haber"
              onClick={() => go(index + 1)}
            >
              <ChevronIcon direction="right" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
