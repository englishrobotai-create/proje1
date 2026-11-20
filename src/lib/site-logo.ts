import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  PHOTO_CONTENT_TYPES,
  PHOTO_EXTENSIONS,
  PHOTO_MAX_BYTES,
  checkPhotoUpload,
  detectPhotoExt,
  type PhotoExt,
} from "./about-photo";
import {
  assertStorageReady,
  blobEnabled,
  blobRead,
  blobRemove,
  blobWrite,
} from "./blob-storage";
import { prisma } from "./db";

/**
 * Üst menü / alt bilgi logosu.
 *
 * - Durum Setting.siteLogo sütununda JSON {ext, version} olarak tutulur.
 * - Dosya `storage/site/logo.<uzantı>` (veya Vercel Blob `site/logo.<uzantı>`) yolunda durur;
 *   `/logo` rotasından sunulur.
 * - Yükleme yoksa `public/smmm.png` varsayılanı kullanılır.
 */

export {
  PHOTO_CONTENT_TYPES,
  PHOTO_EXTENSIONS,
  PHOTO_MAX_BYTES,
  checkPhotoUpload,
  detectPhotoExt,
  type PhotoExt,
};

export const DEFAULT_LOGO_SRC = "/smmm.png";

export type SiteLogo = {
  ext: PhotoExt | null;
  version: number;
};

const DEFAULT_LOGO: SiteLogo = { ext: null, version: 0 };

export function parseSiteLogo(raw: string | null | undefined): SiteLogo {
  if (!raw || !raw.trim()) return { ...DEFAULT_LOGO };
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ...DEFAULT_LOGO };
    }
    const record = data as Record<string, unknown>;
    const ext = PHOTO_EXTENSIONS.find((item) => item === record.ext) ?? null;
    const version =
      typeof record.version === "number" && Number.isFinite(record.version)
        ? Math.max(0, Math.floor(record.version))
        : 0;
    return { ext, version };
  } catch {
    return { ...DEFAULT_LOGO };
  }
}

export async function getSiteLogo(): Promise<SiteLogo> {
  try {
    const rows = await prisma.$queryRaw<{ siteLogo: string | null }[]>`
      SELECT "siteLogo" FROM "Setting" WHERE "id" = 'main' LIMIT 1
    `;
    return parseSiteLogo(rows[0]?.siteLogo);
  } catch {
    // Eski veritabanında sütun yoksa varsayılan; prisma db push sonrası düzelir.
    return { ...DEFAULT_LOGO };
  }
}

export async function saveSiteLogo(logo: SiteLogo): Promise<void> {
  await prisma.setting.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", siteTitle: "Mali Müşavirlik" },
  });
  const json = JSON.stringify({ ext: logo.ext, version: logo.version });
  await prisma.$executeRaw`
    UPDATE "Setting" SET "siteLogo" = ${json} WHERE "id" = 'main'
  `;
}

/** Header/footer ve SEO için kullanılacak logo adresi. */
export function siteLogoSource(logo: SiteLogo): {
  src: string;
  isDefault: boolean;
} {
  if (logo.ext) {
    return { src: `/logo?v=${logo.version}`, isDefault: false };
  }
  return { src: DEFAULT_LOGO_SRC, isDefault: true };
}

function storageDir(): string {
  const configured = process.env.SITE_STORAGE_DIR?.trim();
  return configured
    ? path.resolve(configured)
    : path.join(process.cwd(), "storage", "site");
}

function logoPath(ext: PhotoExt): string {
  return path.join(storageDir(), `logo.${ext}`);
}

const blobPath = (ext: PhotoExt): string => `site/logo.${ext}`;

export async function writeSiteLogoFile(
  ext: PhotoExt,
  bytes: Buffer,
): Promise<void> {
  assertStorageReady();
  if (blobEnabled()) {
    await removeSiteLogoFiles();
    await blobWrite(blobPath(ext), bytes, {
      contentType: PHOTO_CONTENT_TYPES[ext],
      overwrite: true,
    });
    return;
  }
  await mkdir(storageDir(), { recursive: true });
  await removeSiteLogoFiles();
  await writeFile(logoPath(ext), bytes);
}

export async function removeSiteLogoFiles(): Promise<void> {
  if (blobEnabled()) {
    await Promise.all(PHOTO_EXTENSIONS.map((ext) => blobRemove(blobPath(ext))));
    return;
  }
  await Promise.all(
    PHOTO_EXTENSIONS.map((ext) => rm(logoPath(ext), { force: true })),
  );
}

export async function readSiteLogoFile(
  ext: PhotoExt,
): Promise<Buffer | null> {
  if (blobEnabled()) return blobRead(blobPath(ext));
  try {
    return await readFile(logoPath(ext));
  } catch {
    return null;
  }
}
