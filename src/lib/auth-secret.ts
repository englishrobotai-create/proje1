import { createHash } from "node:crypto";

const MIN_LENGTH = 32;

// Daha önce .env.example içinde yayımlanmış anahtarın SHA-256 özeti (anahtarın kendisi kodda yok).
const KNOWN_EXAMPLE_SECRET_HASHES = new Set([
  "c9215df17b073c937c997758ac87bd6f37d0e6aa37d61adc2f61e8d15db5563d",
]);

function isLocalSite(): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(
    process.env.SITE_URL?.trim() ?? "",
  );
}

/**
 * Oturum imzaları için gizli anahtar (yönetici ve mükellef oturumları bundan türer).
 * Canlıda (NODE_ENV=production, SITE_URL localhost değilken) örnek değerle, "degistir..."
 * yer tutucusuyla ya da 32 karakterden kısa bir değerle açılmaz: bilinen bir anahtarla
 * herkes sahte oturum üretebilir.
 */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET tanımlı değil");

  if (process.env.NODE_ENV === "production" && !isLocalSite()) {
    const digest = createHash("sha256").update(secret).digest("hex");
    if (
      secret.length < MIN_LENGTH ||
      /^degistir/i.test(secret) ||
      KNOWN_EXAMPLE_SECRET_HASHES.has(digest)
    ) {
      throw new Error(
        "AUTH_SECRET güvensiz: örnek değer, yer tutucu ya da 32 karakterden kısa. " +
          ".env içinde rastgele yeni bir değer yazın (örn. openssl rand -base64 32).",
      );
    }
  }
  return secret;
}
