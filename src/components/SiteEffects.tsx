"use client";

import { useEffect } from "react";

/**
 * Sitenin ortak hareketleri (yalnızca işaretli öğelere dokunur):
 * - [data-reveal]: ekrana ilk girişte bir kez beliren öğeler (.is-in eklenir)
 * - [data-tilt]: fareyle hafifçe eğilen kartlar (--rx, --ry, --gx, --gy)
 * Hareketi azalt ayarında ve dokunmatik ekranda eğilme yoktur; öğeler doğrudan görünür.
 */
export function SiteEffects() {
  useEffect(() => {
    (window as unknown as { __fx?: boolean }).__fx = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- giriş animasyonu ----
    let io: IntersectionObserver | undefined;
    const reveal = (el: Element) => el.classList.add("is-in");
    if (!reduce && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              reveal(entry.target);
              io?.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -5% 0px" },
      );
    }
    const watch = (el: Element) => {
      if (el.classList.contains("is-in")) return;
      if (io) io.observe(el);
      else reveal(el);
    };
    document.querySelectorAll("[data-reveal]").forEach(watch);

    // sonradan eklenen (sayfa geçişi, akış) öğeleri de yakala
    const mo = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches("[data-reveal]")) watch(node);
          node.querySelectorAll("[data-reveal]").forEach(watch);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // ---- 3D eğilme ----
    const onMove = (event: PointerEvent) => {
      if (reduce || event.pointerType !== "mouse") return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>("[data-tilt]");
      if (!el) return;
      const box = el.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width;
      const y = (event.clientY - box.top) / box.height;
      el.style.setProperty("--ry", `${((x - 0.5) * 9).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${((0.5 - y) * 7).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
    };
    const onOut = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>("[data-tilt]");
      if (!el) return;
      const next = event.relatedTarget;
      if (next instanceof Node && el.contains(next)) return;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });

    return () => {
      io?.disconnect();
      mo.disconnect();
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
    };
  }, []);

  return null;
}
