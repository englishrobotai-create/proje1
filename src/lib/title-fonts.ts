import type { CSSProperties } from "react";

/**
 * Site başlığı (üst menü ve alt bilgideki ofis adı) için seçilebilir yazı tipleri.
 *
 * Yazı tipleri src/app/layout.tsx içinde `next/font/google` ile yüklenir ve `cssVar` alanındaki
 * CSS değişkeniyle erişilir. Yeni bir yazı tipi eklemek için hem orada hem burada tanımlayın.
 * Seçilmeyen yazı tipinin dosyası tarayıcıya indirilmez.
 */
export type TitleFont = {
  /** Veritabanında saklanan anahtar. Boş anahtar = tema varsayılanı. */
  key: string;
  label: string;
  /** next/font'un tanımladığı CSS değişkeni. */
  cssVar: string;
  /** Yazı tipi yüklenemezse kullanılacak genel aile. */
  generic: "serif" | "sans-serif";
};

export const TITLE_FONTS: readonly TitleFont[] = [
  { key: "", label: "Newsreader (varsayılan)", cssVar: "--font-display", generic: "serif" },
  { key: "playfair", label: "Playfair Display", cssVar: "--font-title-playfair", generic: "serif" },
  { key: "merriweather", label: "Merriweather", cssVar: "--font-title-merriweather", generic: "serif" },
  { key: "lora", label: "Lora", cssVar: "--font-title-lora", generic: "serif" },
  { key: "cormorant", label: "Cormorant Garamond", cssVar: "--font-title-cormorant", generic: "serif" },
  { key: "hanken", label: "Hanken Grotesk (site yazısı)", cssVar: "--font-body", generic: "sans-serif" },
  { key: "inter", label: "Inter", cssVar: "--font-title-inter", generic: "sans-serif" },
  { key: "montserrat", label: "Montserrat", cssVar: "--font-title-montserrat", generic: "sans-serif" },
  { key: "raleway", label: "Raleway", cssVar: "--font-title-raleway", generic: "sans-serif" },
  { key: "poppins", label: "Poppins", cssVar: "--font-title-poppins", generic: "sans-serif" },
];

/** Başlık boyutu, tema varsayılanının yüzdesi olarak tutulur (ekran boyutuna göre ölçeklenmeye devam eder). */
export const TITLE_SCALE_MIN = 70;
export const TITLE_SCALE_MAX = 150;
export const TITLE_SCALE_STEP = 5;
export const TITLE_SCALE_DEFAULT = 100;

/** Üst menüdeki başlığın büyük ekranda varsayılan boyutu (px); yalnızca yönetim önizlemesi için. */
export const TITLE_PREVIEW_BASE_PX = 27;

export function isTitleFontKey(value: unknown): value is string {
  return typeof value === "string" && TITLE_FONTS.some((font) => font.key === value);
}

/** Bilinmeyen veya bozuk bir değer varsa tema varsayılanına ("") döner. */
export function normalizeTitleFont(value: unknown): string {
  return isTitleFontKey(value) ? value : "";
}

/** Bilinmeyen, sayı olmayan veya aralık dışı değerlerde varsayılan boyuta (%100) döner. */
export function normalizeTitleScale(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return TITLE_SCALE_DEFAULT;
  const rounded = Math.round(n);
  if (rounded < TITLE_SCALE_MIN || rounded > TITLE_SCALE_MAX) {
    return TITLE_SCALE_DEFAULT;
  }
  return rounded;
}

/** `font-family` olarak kullanılabilir yazı tipi listesi, ör. `var(--font-title-lora), serif`. */
export function titleFontStack(key: string): string {
  const font = TITLE_FONTS.find((item) => item.key === key) ?? TITLE_FONTS[0];
  return `var(${font.cssVar}), ${font.generic === "serif" ? "Georgia, serif" : "system-ui, sans-serif"}`;
}

/**
 * Site düzeninin kök öğesine verilecek CSS değişkenleri. Ayar varsayılandaysa hiçbir değişken
 * eklenmez; böylece tema CSS'indeki mevcut görünüm aynen korunur.
 */
export function titleCssVars(
  font: string,
  scale: number,
): { style: CSSProperties | undefined; custom: boolean } {
  const customFont = font !== "";
  const customScale = scale !== TITLE_SCALE_DEFAULT;
  if (!customFont && !customScale) return { style: undefined, custom: false };

  const style: Record<string, string> = {};
  if (customFont) style["--title-font"] = titleFontStack(font);
  if (customScale) style["--title-scale"] = String(scale / 100);
  return { style: style as CSSProperties, custom: true };
}
