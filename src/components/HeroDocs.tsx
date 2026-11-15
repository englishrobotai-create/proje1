"use client";

import { useRef } from "react";

type Row = { label: string; width: number; total?: boolean };

const sheets: { className: string; title: string; rows: Row[]; stamp?: boolean }[] = [
  {
    className: "doc doc-c",
    title: "Gelir Tablosu",
    rows: [
      { label: "Satışlar", width: 44 },
      { label: "Satışların maliyeti", width: 36 },
      { label: "Faaliyet gideri", width: 30 },
      { label: "Dönem net kârı", width: 40, total: true },
    ],
  },
  {
    className: "doc doc-b",
    title: "Bordro",
    rows: [
      { label: "Brüt ücret", width: 42 },
      { label: "SGK işçi payı", width: 28 },
      { label: "Gelir vergisi", width: 32 },
      { label: "Net ödenen", width: 40, total: true },
    ],
  },
  {
    className: "doc doc-a",
    title: "KDV Beyannamesi",
    stamp: true,
    rows: [
      { label: "Matrah", width: 46 },
      { label: "Hesaplanan KDV", width: 34 },
      { label: "İndirilecek KDV", width: 30 },
      { label: "Ödenecek KDV", width: 38, total: true },
    ],
  },
];

/** Hero'daki dekoratif 3D evrak yığını. Fareyle hafifçe eğilir; dokunmatik ekranda sabit kalır. */
export function HeroDocs() {
  const stage = useRef<HTMLDivElement>(null);

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = stage.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    el.style.setProperty("--tilt-y", `${(x * 14).toFixed(2)}deg`);
    el.style.setProperty("--tilt-x", `${(-y * 10).toFixed(2)}deg`);
  }

  function onLeave() {
    const el = stage.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <div
      ref={stage}
      className="docs"
      aria-hidden="true"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <svg width="0" height="0" focusable="false" style={{ position: "absolute" }}>
        <defs>
          <filter id="stamp-ink" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" />
          </filter>
        </defs>
      </svg>
      <div className="docs-floor" />
      <div className="docs-stack">
        {sheets.map((sheet) => (
          <div key={sheet.title} className={sheet.className}>
            <span className="doc-title">{sheet.title}</span>
            <div className="doc-rows">
              {sheet.rows.map((row) => (
                <div
                  key={row.label}
                  className={`doc-row${row.total ? " is-total" : ""}`}
                >
                  <span>{row.label}</span>
                  <i style={{ width: `${row.width}%` }} />
                </div>
              ))}
            </div>
            {sheet.stamp ? (
              <>
                <div className="doc-sign">
                  <span>Mükellef</span>
                  <span>Mali müşavir</span>
                </div>
                <div className="doc-stamp">ONAYLANDI</div>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
