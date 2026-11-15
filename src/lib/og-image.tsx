import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/**
 * Paylaşım görseli (Open Graph / Twitter kartı). Her yazı ve site geneli için
 * sunucuda otomatik üretilir; görsel yüklemeye gerek yoktur.
 *
 * Yazı tipi: Newsreader (SIL OFL). Türkçe karakterler (ş, ğ, İ, ı) için "latin" ve
 * "latin-ext" alt kümeleri birlikte yüklenir: src/assets/og-fonts/
 */
export const OG_SIZE = { width: 1200, height: 630 } as const;

const FONT_DIR = path.join(process.cwd(), "src", "assets", "og-fonts");

type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 600;
  style: "normal";
};

let fontsPromise: Promise<OgFont[]> | undefined;

function loadFonts(): Promise<OgFont[]> {
  fontsPromise ??= Promise.all(
    ["newsreader-latin-600-normal.woff", "newsreader-latin-ext-600-normal.woff"].map(
      async (file) => {
        const buffer = await readFile(path.join(FONT_DIR, file));
        const data = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        ) as ArrayBuffer;
        return { name: "Newsreader", data, weight: 600 as const, style: "normal" as const };
      },
    ),
  ).catch((error) => {
    fontsPromise = undefined;
    throw error;
  });
  return fontsPromise;
}

function fitTitle(text: string): { text: string; size: number } {
  const clean = text.replace(/\s+/g, " ").trim();
  const clipped = clean.length > 120 ? `${clean.slice(0, 119).trimEnd()}…` : clean;
  const size = clipped.length <= 36 ? 92 : clipped.length <= 70 ? 76 : 62;
  return { text: clipped, size };
}

export async function renderOgImage(options: {
  headline: string;
  footnote: string;
  cacheSeconds?: number;
}): Promise<Response> {
  // Yazı tipi dosyaları okunamazsa görsel yine üretilir (varsayılan yazı tipiyle).
  const fonts = await loadFonts().catch(() => [] as OgFont[]);
  const { text, size } = fitTitle(options.headline);
  const cache = options.cacheSeconds ?? 3600;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0e1b30",
          borderLeft: "16px solid #b8322a",
          padding: "76px 84px 68px 76px",
          fontFamily: "Newsreader",
          fontWeight: 600,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: size,
            lineHeight: 1.14,
            color: "#ffffff",
            letterSpacing: "-0.01em",
          }}
        >
          {text}
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#c9d4e8" }}>
          {options.footnote}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      ...(fonts.length > 0 ? { fonts } : {}),
      headers: {
        "Cache-Control": `public, max-age=${cache}, s-maxage=${cache}, stale-while-revalidate=86400`,
      },
    },
  );
}
