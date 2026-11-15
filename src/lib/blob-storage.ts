import { del, get, list, put } from "@vercel/blob";

/**
 * Dosya depolama sürücüsü seçimi.
 *
 * - `BLOB_READ_WRITE_TOKEN` (ya da OIDC ile `BLOB_STORE_ID`) tanımlıysa dosyalar Vercel Blob'da
 *   tutulur. Vercel'de dosya sistemi kalıcı ve yazılabilir değildir, bu yüzden orada tek yol budur.
 * - Tanımlı değilse (VPS, yerel geliştirme) dosyalar diskte tutulur: PORTAL_STORAGE_DIR ve
 *   SITE_STORAGE_DIR (bkz. portal-files.ts, about-photo.ts).
 *
 * Mükellef belgeleri gizlidir: Blob mağazası mutlaka "private" olarak oluşturulmalıdır. Dosyalara
 * yalnızca yetki denetimi yapan rotalar üzerinden (sunucu okuyup yanıtlar) erişilir; Blob adresi
 * hiçbir zaman tarayıcıya verilmez.
 */
export const blobEnabled = (): boolean =>
  Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() || process.env.BLOB_STORE_ID?.trim(),
  );

/** Vercel'de depolama bağlı değilse, sessizce başarısız olmak yerine açık bir hata verir. */
export function assertStorageReady(): void {
  if (process.env.VERCEL && !blobEnabled()) {
    throw new Error(
      "Dosya depolama tanımlı değil: Vercel projesine özel (private) bir Blob mağazası bağlayın.",
    );
  }
}

export async function blobWrite(
  pathname: string,
  bytes: Buffer,
  options: { contentType?: string; overwrite?: boolean } = {},
): Promise<void> {
  await put(pathname, bytes, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: options.overwrite ?? false,
    contentType: options.contentType ?? "application/octet-stream",
  });
}

/** Dosya yoksa null döner; diğer hatalar (yetki, ağ) olduğu gibi fırlatılır. */
export async function blobRead(pathname: string): Promise<Buffer | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}

export async function blobRemove(pathname: string): Promise<void> {
  await del(pathname);
}

/** Verilen önekle başlayan tüm dosyaları siler. */
export async function blobRemovePrefix(prefix: string): Promise<void> {
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    if (page.blobs.length > 0) {
      await del(page.blobs.map((blob) => blob.pathname));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}
