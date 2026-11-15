/**
 * Mükellef Köşesi: sunucu ve tarayıcı tarafında ortak kullanılan, saf (veritabanı/dosya
 * erişimi olmayan) yardımcılar. Para birimi tam sayı kuruş olarak tutulur.
 */

/** Mesajın açıklama (gövde) alanı en çok bu kadar karakter olabilir. */
export const MESSAGE_BODY_MAX = 2000;

/** Satır sonlarını \n'e çevirir, baştaki/sondaki boşlukları ve aşırı boş satırları temizler. */
export function cleanMessageBody(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Mesajın ek dosyası var mı (yalnızca metin içeren mesajlarda diskte dosya yoktur). */
export const hasAttachment = (file: { storedName: string }): boolean => file.storedName !== "";

export const ALLOWED_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "xls",
  "xlsx",
  "doc",
  "docx",
  "csv",
  "xml",
  "zip",
] as const;

export const ALLOWED_EXTENSIONS_LABEL = "PDF, JPG, PNG, Excel, Word, CSV, XML, ZIP";

/** Tek işlemde kabul edilen en yüksek tutar: 100 milyon TL. */
export const MAX_AMOUNT_KURUS = 100_000_000 * 100;

const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

const EMAIL_PATTERN = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export function isEmail(value: string): boolean {
  return value.length <= 120 && EMAIL_PATTERN.test(value);
}

// ---- Dönem (YYYY-AA) ----

export function isPeriod(value: string): boolean {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  return year >= 2000 && year <= 2100;
}

export function formatPeriod(period: string): string {
  if (!isPeriod(period)) return period;
  const [year, month] = period.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

export function periodOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** `now` ayından başlayarak geriye `back`, ileriye `forward` ay; en yeni en üstte. */
export function periodOptions(now: Date, back = 14, forward = 1): string[] {
  const out: string[] = [];
  for (let offset = forward; offset >= -back; offset -= 1) {
    out.push(periodOf(new Date(now.getFullYear(), now.getMonth() + offset, 1)));
  }
  return out;
}

/** Bir önceki ay: beyanname dönemleri çoğunlukla geçen aya aittir. */
export function previousPeriod(now: Date): string {
  return periodOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));
}

// ---- Tarih ----

export function isDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (year < 2000 || year > 2100) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function todayDateOnly(now: Date = new Date()): string {
  return `${periodOf(now)}-${String(now.getDate()).padStart(2, "0")}`;
}

export function formatDateOnly(value: string): string {
  if (!isDateOnly(value)) return value;
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---- Para ----

/** 123456 → "1.234,56 ₺" (eksi değerlerde "-1.234,56 ₺"). */
export function formatKurus(kurus: number): string {
  const rounded = Math.round(kurus);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  const lira = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}${lira},${frac} ₺`;
}

/**
 * Türkçe yazılmış tutarı kuruşa çevirir: "1.234,56", "1234,5", "500". Nokta binlik,
 * virgül kuruş ayracıdır. "1234.56" gibi belirsiz yazımlar yanlış okunmasın diye reddedilir.
 * Geçersiz, sıfır ya da çok büyük tutarlarda null döner.
 */
export function parseTL(input: string): number | null {
  const text = input
    .trim()
    .replace(/\s*(₺|TL|TRY)$/i, "")
    .replace(/\s+/g, "");
  if (!/^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(",");
  const lira = Number(whole.replace(/\./g, ""));
  const kurus = lira * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(kurus) || kurus <= 0 || kurus > MAX_AMOUNT_KURUS) {
    return null;
  }
  return kurus;
}

export type LedgerKind = "charge" | "payment";

export function isLedgerKind(value: string): value is LedgerKind {
  return value === "charge" || value === "payment";
}

/** Pozitif = mükellef ofise borçlu; negatif = ofiste alacağı var. */
export function signedAmount(kind: LedgerKind, amountKurus: number): number {
  return kind === "charge" ? amountKurus : -amountKurus;
}

export function describeBalance(kurus: number): string {
  if (kurus > 0) return `${formatKurus(kurus)} borç`;
  if (kurus < 0) return `${formatKurus(-kurus)} alacak`;
  return "Borç yok";
}

// ---- Dosya adı / türü ----

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
}

export function isAllowedExtension(ext: string): boolean {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

/** Yol ayraçlarını, denetim karakterlerini ve fazla boşluğu temizler; en çok 120 karakter. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩"<>|:*?]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^\.+/, "");
  if (!cleaned) return "belge";
  if (cleaned.length <= 120) return cleaned;
  const ext = fileExtension(cleaned);
  const keep = ext ? 120 - ext.length - 1 : 120;
  return ext ? `${cleaned.slice(0, keep)}.${ext}` : cleaned.slice(0, 120);
}

export function withoutExtension(name: string): string {
  const ext = fileExtension(name);
  return ext ? name.slice(0, -(ext.length + 1)) : name;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1).replace(".", ",")} MB`;
}

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((value, index) => bytes[offset + index] === value);

/**
 * Uzantının dosya içeriğiyle uyuştuğunu denetler (ilk baytlar). Amaç, "fatura.pdf" adıyla
 * yüklenmiş çalıştırılabilir ya da HTML dosyasını elemek. Virüs taraması değildir.
 */
export function matchesFileSignature(ext: string, bytes: Uint8Array): boolean {
  if (bytes.length === 0) return false;
  switch (ext) {
    case "pdf": {
      const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
      return head.includes("%PDF-");
    }
    case "jpg":
    case "jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "png":
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "xlsx":
    case "docx":
    case "zip":
      // Boş zip ("PK\x05\x06") kabul edilmez; en az bir dosya içermeli.
      return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
    case "xls":
    case "doc":
      return (
        startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) ||
        // Bazı programlar "xls/doc" adıyla yeni biçim (zip) üretir.
        startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])
      );
    case "csv": {
      const sample = bytes.subarray(0, 4096);
      return !sample.includes(0);
    }
    case "xml": {
      let index = 0;
      if (startsWith(bytes, [0xef, 0xbb, 0xbf])) index = 3;
      while (index < bytes.length && [0x20, 0x09, 0x0a, 0x0d].includes(bytes[index])) {
        index += 1;
      }
      return bytes[index] === 0x3c && !bytes.subarray(0, 4096).includes(0);
    }
    default:
      return false;
  }
}

export const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  csv: "text/csv; charset=utf-8",
  xml: "application/xml",
  zip: "application/zip",
};

// ---- Şifre ----

export const MIN_PASSWORD_LENGTH = 10;

/** Hata metni döndürür; geçerliyse null. bcrypt en fazla 72 bayt okur. */
export function validateNewPassword(password: string, email = ""): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`;
  }
  if (new TextEncoder().encode(password).length > 72) {
    return "Şifre çok uzun (en fazla 72 bayt).";
  }
  if (/^\d+$/.test(password) || /^(.)\1+$/.test(password)) {
    return "Şifre yalnızca rakamlardan ya da tek karakterin tekrarından oluşmamalı.";
  }
  if (email && password.toLowerCase() === email.toLowerCase()) {
    return "Şifre e-posta adresinizle aynı olamaz.";
  }
  return null;
}

/** Sunucu işlemlerinin ortak dönüş biçimi. */
export type PortalState = {
  error?: string;
  success?: string;
  /** Bir kez gösterilen davet / sıfırlama bağlantısı. */
  link?: string;
};
