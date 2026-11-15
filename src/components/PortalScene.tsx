"use client";

import { useEffect, useRef } from "react";
import {
  IconCheck,
  IconDownload,
  IconFile,
  IconLock,
  IconMail,
  IconSend,
} from "@/components/portal/PortalIcons";

/**
 * Ana sayfadaki Mükellef Köşesi için dekoratif 3D sahne.
 * - Ekrana girince bir kez oynar (dosyalar uçarak gelir, "TAMAM" mührü basılır).
 * - Fareyle hafifçe eğilir; dokunmatik ekranda ve "hareketi azalt" ayarında sabit kalır.
 * - Süs olduğu için ekran okuyuculardan gizlidir; içerik yanındaki metinde.
 */
export function PortalScene() {
  const scene = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    const start = () => {
      el.classList.remove("is-pending");
      el.classList.add("is-in");
    };
    if (typeof IntersectionObserver === "undefined") {
      start();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          start();
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = scene.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    el.style.setProperty("--tilt-y", `${(x * 16).toFixed(2)}deg`);
    el.style.setProperty("--tilt-x", `${(-y * 12).toFixed(2)}deg`);
  }

  function onLeave() {
    const el = scene.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <div className="mk-scene-wrap" aria-hidden="true">
      <noscript>
        <style>{".mk-scene.is-pending *{animation:none!important}"}</style>
      </noscript>
      <div
        ref={scene}
        className="mk-scene is-pending"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <svg width="0" height="0" focusable="false" style={{ position: "absolute" }}>
          <defs>
            <filter id="mk-ink" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" />
            </filter>
          </defs>
        </svg>

        <div className="mk-glow" />
        <div className="mk-floor">
          <div className="mk-ring mk-ring-a" />
          <div className="mk-ring mk-ring-b" />
        </div>

        <div className="mk-stage">
          <div className="mk-window">
            <div className="mk-win-bar">
              <span className="mk-dots">
                <i />
                <i />
                <i />
              </span>
              <span className="mk-win-title">Mükellef Köşesi</span>
            </div>
            <div className="mk-win-body">
              <p className="mk-win-sec">Ofisten gelenler</p>
              <div className="mk-win-row">
                <span className="mk-win-ico is-green">
                  <IconFile size="1.25em" />
                </span>
                <span className="mk-win-txt">Tahakkuk fişi</span>
                <span className="mk-pill is-get">
                  <IconDownload size="1em" /> İndir
                </span>
              </div>
              <div className="mk-win-row">
                <span className="mk-win-ico is-green">
                  <IconFile size="1.25em" />
                </span>
                <span className="mk-win-txt">KDV beyannamesi</span>
                <span className="mk-pill is-get">
                  <IconDownload size="1em" /> İndir
                </span>
              </div>
              <p className="mk-win-sec">Eksik belgeler</p>
              <div className="mk-win-row">
                <span className="mk-win-ico is-blue">
                  <IconCheck size="1.25em" />
                </span>
                <span className="mk-win-txt">Banka ekstresi</span>
                <span />
              </div>
              <div className="mk-win-row">
                <span className="mk-win-ico is-amber" />
                <span className="mk-win-txt">Z raporu</span>
                <span className="mk-pill is-wait">Bekleniyor</span>
              </div>
              <div className="mk-win-compose">
                <span>Ofise mesaj yazın</span>
                <b>
                  <IconSend size="1.2em" />
                </b>
              </div>
            </div>
          </div>

          <div className="mk-stamp">
            <span>TAMAM</span>
          </div>

          <div className="mk-sat mk-sat-pdf">
            <div className="mk-float">
              <div className="mk-file is-pdf">
                <b>PDF</b>
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>

          <div className="mk-sat mk-sat-xls">
            <div className="mk-float">
              <div className="mk-file is-xls">
                <b>XLS</b>
                <span className="cells">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </div>
          </div>

          <div className="mk-sat mk-sat-zip">
            <div className="mk-float">
              <div className="mk-file is-zip">
                <b>ZIP</b>
                <span className="zip-stripe" />
              </div>
            </div>
          </div>

          <div className="mk-sat mk-sat-msg">
            <div className="mk-float">
              <div className="mk-msg">
                <IconMail size="1.5em" />
                Yeni mesaj
              </div>
            </div>
          </div>

          <div className="mk-sat mk-sat-lock">
            <div className="mk-float">
              <div className="mk-lock">
                <IconLock size="2.4em" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
