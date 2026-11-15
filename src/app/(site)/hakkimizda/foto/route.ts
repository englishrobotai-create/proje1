import {
  PHOTO_CONTENT_TYPES,
  getAboutPhoto,
  readAboutPhotoFile,
} from "@/lib/about-photo";

// Yüklenen hakkımda fotoğrafı. Adres sürüm numarası taşır (?v=), bu yüzden uzun süre önbelleğe
// alınabilir; fotoğraf değişince ya da gizlenip yeniden gösterilince sürüm artar.
// Gizliyken 404 döner: site sahibi fotoğrafı sayfadan gizlediğinde dosya adresle de açılmaz.
export const dynamic = "force-dynamic";

export async function GET() {
  const photo = await getAboutPhoto();
  if (!photo.ext || !photo.show) return new Response("Bulunamadı", { status: 404 });

  const bytes = await readAboutPhotoFile(photo.ext);
  if (!bytes) return new Response("Bulunamadı", { status: 404 });

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": PHOTO_CONTENT_TYPES[photo.ext],
      "Content-Length": String(bytes.length),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
