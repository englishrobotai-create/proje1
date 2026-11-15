import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./db";
import {
  assertStorageReady,
  blobEnabled,
  blobRead,
  blobRemove,
  blobWrite,
} from "./blob-storage";

/**
 * Hakkımda sayfası fotoğrafı.
 *
 * - Durum (göster/gizle, uzantı, sürüm) Setting tablosundaki `aboutPhoto` sütununda JSON olarak
 *   tutulur; sütun ham SQL ile okunur/yazılır (professional-info.ts ile aynı desen).
 * - Yüklenen dosya `public/` dışında, `<SITE_STORAGE_DIR | ./storage/site>/about-photo.<uzantı>`
 *   yolunda durur ve /hakkimizda/foto rotasından sunulur (derleme sonrası eklenen dosyalar için
 *   `public/` güvenilir değildir). Vercel'de (BLOB_READ_WRITE_TOKEN tanımlıyken) aynı dosya
 *   özel Blob mağazasında `site/about-photo.<uzantı>` olarak tutulur (bkz. blob-storage.ts).
 * - Hiç fotoğraf yüklenmemişse `public/ornek-profil.webp` örnek illüstrasyonu gösterilir.
 */

export const PHOTO_EXTENSIONS = ["jpg", "png", "webp"] as const;
export type PhotoExt = (typeof PHOTO_EXTENSIONS)[number];

export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;
export const SAMPLE_PHOTO_SRC = "/ornek-profil.webp";

export const PHOTO_CONTENT_TYPES: Record<PhotoExt, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export type AboutPhoto = {
  /** Hakkımda sayfasında gösterilsin mi? Varsayılan: evet. */
  show: boolean;
  /** Yüklenmiş fotoğrafın uzantısı; yoksa örnek görsel kullanılır. */
  ext: PhotoExt | null;
  /** Her yüklemede artar; tarayıcı önbelleğini yeniler. */
  version: number;
};

const DEFAULT_PHOTO: AboutPhoto = { show: true, ext: null, version: 0 };

export function parseAboutPhoto(raw: string | null | undefined): AboutPhoto {
  if (!raw || !raw.trim()) return { ...DEFAULT_PHOTO };
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ...DEFAULT_PHOTO };
    }
    const record = data as Record<string, unknown>;
    const ext = PHOTO_EXTENSIONS.find((item) => item === record.ext) ?? null;
    const version =
      typeof record.version === "number" && Number.isFinite(record.version)
        ? Math.max(0, Math.floor(record.version))
        : 0;
    return { show: record.show !== false, ext, version };
  } catch {
    return { ...DEFAULT_PHOTO };
  }
}

export async function getAboutPhoto(): Promise<AboutPhoto> {
  try {
    const rows = await prisma.$queryRaw<{ aboutPhoto: string | null }[]>`
      SELECT "aboutPhoto" FROM "Setting" WHERE "id" = 'main' LIMIT 1
    `;
    return parseAboutPhoto(rows[0]?.aboutPhoto);
  } catch {
    return { ...DEFAULT_PHOTO };
  }
}

export async function saveAboutPhoto(photo: AboutPhoto): Promise<void> {
  await prisma.setting.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", siteTitle: "Mali Müşavirlik" },
  });
  const json = JSON.stringify({
    show: photo.show,
    ext: photo.ext,
    version: photo.version,
  });
  await prisma.$executeRaw`
    UPDATE "Setting" SET "aboutPhoto" = ${json} WHERE "id" = 'main'
  `;
}

/** Sayfada kullanılacak görsel adresi ve örnek olup olmadığı. */
export function aboutPhotoSource(photo: AboutPhoto): {
  src: string;
  isSample: boolean;
} {
  if (photo.ext) {
    return { src: `/hakkimizda/foto?v=${photo.version}`, isSample: false };
  }
  return { src: SAMPLE_PHOTO_SRC, isSample: true };
}

function storageDir(): string {
  const configured = process.env.SITE_STORAGE_DIR?.trim();
  return configured
    ? path.resolve(configured)
    : path.join(process.cwd(), "storage", "site");
}

function photoPath(ext: PhotoExt): string {
  return path.join(storageDir(), `about-photo.${ext}`);
}

const blobPath = (ext: PhotoExt): string => `site/about-photo.${ext}`;

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((value, index) => bytes[offset + index] === value);
}

/** Dosya içeriğinden (ilk baytlar) türü belirler; uzantıya ya da tarayıcının bildirdiği türe güvenilmez. */
export function detectPhotoExt(bytes: Uint8Array): PhotoExt | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  // WebP: "RIFF" .... "WEBP"
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "webp";
  }
  return null;
}

export type PhotoCheck =
  | { ok: true; ext: PhotoExt; bytes: Buffer }
  | { ok: false; error: string };

export async function checkPhotoUpload(file: File): Promise<PhotoCheck> {
  if (file.size > PHOTO_MAX_BYTES) {
    return {
      ok: false,
      error: `Fotoğraf çok büyük. En fazla ${PHOTO_MAX_BYTES / 1024 / 1024} MB yüklenebilir.`,
    };
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = detectPhotoExt(bytes);
  if (!ext) {
    return { ok: false, error: "Yalnızca JPG, PNG veya WebP fotoğraf yüklenebilir." };
  }
  return { ok: true, ext, bytes };
}

/** Yeni fotoğrafı yazar; önceki uzantıdaki dosya silinir. */
export async function writeAboutPhotoFile(ext: PhotoExt, bytes: Buffer): Promise<void> {
  assertStorageReady();
  if (blobEnabled()) {
    await removeAboutPhotoFiles();
    await blobWrite(blobPath(ext), bytes, {
      contentType: PHOTO_CONTENT_TYPES[ext],
      overwrite: true,
    });
    return;
  }
  await mkdir(storageDir(), { recursive: true });
  await removeAboutPhotoFiles();
  await writeFile(photoPath(ext), bytes);
}

export async function removeAboutPhotoFiles(): Promise<void> {
  if (blobEnabled()) {
    await Promise.all(PHOTO_EXTENSIONS.map((ext) => blobRemove(blobPath(ext))));
    return;
  }
  await Promise.all(
    PHOTO_EXTENSIONS.map((ext) => rm(photoPath(ext), { force: true })),
  );
}

export async function readAboutPhotoFile(ext: PhotoExt): Promise<Buffer | null> {
  if (blobEnabled()) return blobRead(blobPath(ext));
  try {
    return await readFile(photoPath(ext));
  } catch {
    return null;
  }
}
