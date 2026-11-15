import { getSession } from "@/lib/auth";
import {
  PHOTO_CONTENT_TYPES,
  getAboutPhoto,
  readAboutPhotoFile,
} from "@/lib/about-photo";

// Yönetim önizlemesi: oturum açmış yönetici, fotoğraf sayfada gizli olsa da yüklenmiş dosyayı görür.
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Bulunamadı", { status: 404 });

  const photo = await getAboutPhoto();
  if (!photo.ext) return new Response("Bulunamadı", { status: 404 });

  const bytes = await readAboutPhotoFile(photo.ext);
  if (!bytes) return new Response("Bulunamadı", { status: 404 });

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": PHOTO_CONTENT_TYPES[photo.ext],
      "Content-Length": String(bytes.length),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
