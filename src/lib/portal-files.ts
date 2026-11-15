import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ALLOWED_EXTENSIONS_LABEL,
  CONTENT_TYPES,
  fileExtension,
  formatSize,
  isAllowedExtension,
  matchesFileSignature,
  sanitizeFileName,
} from "./portal-shared";
import { isId, storedBytes, type PortalFileRow } from "./portal-db";
import {
  assertStorageReady,
  blobEnabled,
  blobRead,
  blobRemove,
  blobRemovePrefix,
  blobWrite,
} from "./blob-storage";

/**
 * Yüklenen belgeler `public/` dışında, web'den doğrudan erişilemeyen bir klasörde tutulur:
 *   <PORTAL_STORAGE_DIR | ./storage/portal>/<mukellefId>/<rastgele-ad>
 * Diskteki ad rastgeledir (özgün ad yalnızca veritabanında, gösterim için). Dosyalar yalnızca
 * yetki denetimi yapan indirme rotaları üzerinden sunulur.
 *
 * Vercel'de (BLOB_READ_WRITE_TOKEN tanımlıyken) aynı yapı özel Blob mağazasında tutulur:
 *   portal/<mukellefId>/<rastgele-ad>   (bkz. blob-storage.ts)
 */

const MB = 1024 * 1024;

function envMb(name: string, fallback: number, min: number, max: number): number {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(Math.max(value, min), max);
}

/**
 * Tek dosya sınırı (varsayılan ve üst sınır 25 MB). Sunucu işlemi gövde sınırı (next.config.ts:
 * 27 MB) bunun üstündedir. Vercel işlevlerinin istek gövdesi sınırı 4,5 MB olduğu için orada tek
 * dosya en çok 4 MB olabilir.
 */
const platformMaxMb = () => (process.env.VERCEL ? 4 : 25);
export const maxUploadBytes = () =>
  Math.floor(envMb("PORTAL_MAX_UPLOAD_MB", platformMaxMb(), 1, platformMaxMb()) * MB);
export const quotaBytes = () => Math.floor(envMb("PORTAL_QUOTA_MB", 500, 10, 100_000) * MB);

function rootDir(): string {
  const configured = process.env.PORTAL_STORAGE_DIR?.trim();
  return configured ? path.resolve(configured) : path.join(process.cwd(), "storage", "portal");
}

/** Kimlik biçimi doğrulanır; yol dışına çıkış (../) mümkün olmaz. */
function mukellefDir(mukellefId: string): string {
  if (!isId(mukellefId)) throw new Error("Geçersiz mükellef kimliği");
  return path.join(rootDir(), mukellefId);
}

function storedPath(mukellefId: string, storedName: string): string {
  if (!isId(storedName)) throw new Error("Geçersiz dosya adı");
  return path.join(mukellefDir(mukellefId), storedName);
}

/** Blob yolu; kimlik biçimleri doğrulanır (yol dışına çıkış mümkün olmaz). */
function blobKey(mukellefId: string, storedName?: string): string {
  if (!isId(mukellefId)) throw new Error("Geçersiz mükellef kimliği");
  if (storedName === undefined) return `portal/${mukellefId}/`;
  if (!isId(storedName)) throw new Error("Geçersiz dosya adı");
  return `portal/${mukellefId}/${storedName}`;
}

export type UploadCheck =
  | { ok: true; ext: string; originalName: string; bytes: Buffer }
  | { ok: false; error: string };

/**
 * Ek dosya isteğe bağlıdır: hiç dosya seçilmediyse `{ ok: true, none: true }` döner.
 * Dosya seçilmişse `checkUpload` ile aynı denetimler uygulanır.
 */
export async function checkOptionalUpload(
  value: FormDataEntryValue | null,
  mukellefId: string,
): Promise<UploadCheck | { ok: true; none: true }> {
  // Dosya seçilmediğinde tarayıcı (ve sunucu işlemi aktarımı) boş bir "dosya" gönderir; boyutu 0
  // olan her parça "ek yok" sayılır.
  if (!(value instanceof File) || value.size === 0) return { ok: true, none: true };
  return checkUpload(value, mukellefId);
}

/** Boyut, uzantı, içerik imzası ve mükellef başına alan sınırını denetler. */
export async function checkUpload(
  value: FormDataEntryValue | null,
  mukellefId: string,
): Promise<UploadCheck> {
  if (!(value instanceof File) || value.size === 0) {
    return { ok: false, error: "Bir dosya seçin." };
  }
  const limit = maxUploadBytes();
  if (value.size > limit) {
    return {
      ok: false,
      error: `Dosya çok büyük (${formatSize(value.size)}). En fazla ${formatSize(limit)} yüklenebilir.`,
    };
  }
  const originalName = sanitizeFileName(value.name);
  const ext = fileExtension(originalName);
  if (!isAllowedExtension(ext)) {
    return {
      ok: false,
      error: `Bu dosya türü kabul edilmiyor. Kabul edilenler: ${ALLOWED_EXTENSIONS_LABEL}.`,
    };
  }
  if ((await storedBytes(mukellefId)) + value.size > quotaBytes()) {
    return {
      ok: false,
      error: "Bu hesabın belge alanı doldu. Eski belgelerin silinmesi için ofisle iletişime geçin.",
    };
  }
  const bytes = Buffer.from(await value.arrayBuffer());
  if (!matchesFileSignature(ext, bytes)) {
    return {
      ok: false,
      error:
        ext === "zip"
          ? "Bu dosya geçerli bir ZIP arşivi değil. Dosyaları yeniden ZIP olarak sıkıştırıp tekrar deneyin."
          : `Dosya içeriği .${ext} biçimiyle uyuşmuyor. Dosyayı PDF olarak kaydedip tekrar deneyin.`,
    };
  }
  return { ok: true, ext, originalName, bytes };
}

/** Rastgele adla diske yazar; yazılan adı döndürür. */
export async function storeFile(mukellefId: string, bytes: Buffer): Promise<string> {
  assertStorageReady();
  const storedName = randomUUID();
  if (blobEnabled()) {
    await blobWrite(blobKey(mukellefId, storedName), bytes);
    return storedName;
  }
  const dir = mukellefDir(mukellefId);
  await mkdir(dir, { recursive: true });
  await writeFile(storedPath(mukellefId, storedName), bytes, { flag: "wx", mode: 0o600 });
  return storedName;
}

export async function readStored(file: PortalFileRow): Promise<Buffer | null> {
  if (!file.storedName) return null; // yalnızca metin içeren mesaj
  if (blobEnabled()) {
    if (!isId(file.mukellefId) || !isId(file.storedName)) return null;
    return blobRead(blobKey(file.mukellefId, file.storedName));
  }
  try {
    return await readFile(storedPath(file.mukellefId, file.storedName));
  } catch {
    return null;
  }
}

export async function removeStored(mukellefId: string, storedName: string) {
  if (!storedName) return;
  if (blobEnabled()) {
    try {
      await blobRemove(blobKey(mukellefId, storedName));
    } catch (error) {
      // Silme hatası işlemi durdurmaz, ama gizli bir belgenin depoda kalmış olabileceği görülsün.
      console.error("Blob dosyası silinemedi:", error);
    }
    return;
  }
  try {
    await rm(storedPath(mukellefId, storedName), { force: true });
  } catch {
    // dosya zaten yoksa sorun değil
  }
}

export async function removeAllStored(mukellefId: string) {
  if (blobEnabled()) {
    try {
      await blobRemovePrefix(blobKey(mukellefId));
    } catch (error) {
      console.error("Blob klasörü silinemedi:", error);
    }
    return;
  }
  try {
    await rm(mukellefDir(mukellefId), { recursive: true, force: true });
  } catch {
    // klasör yoksa sorun değil
  }
}

/** ASCII olmayan adlar için RFC 5987 (filename*) ile birlikte. */
function contentDisposition(name: string): string {
  const fallback = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`;
}

/** Yetki denetimi çağıran rotada yapılır; burası yalnızca güvenli yanıtı kurar. */
export function fileResponse(file: PortalFileRow, bytes: Buffer): Response {
  const ext = fileExtension(file.originalName);
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Content-Length": String(bytes.length),
      "Content-Disposition": contentDisposition(file.originalName),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
