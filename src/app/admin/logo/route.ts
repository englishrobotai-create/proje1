import { getSession } from "@/lib/auth";
import {
  PHOTO_CONTENT_TYPES,
  getSiteLogo,
  readSiteLogoFile,
} from "@/lib/site-logo";

// Yönetim önizlemesi: oturum açmış yönetici yüklenen logoyu görür.
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Bulunamadı", { status: 404 });

  const logo = await getSiteLogo();
  if (!logo.ext) return new Response("Bulunamadı", { status: 404 });

  const bytes = await readSiteLogoFile(logo.ext);
  if (!bytes) return new Response("Bulunamadı", { status: 404 });

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": PHOTO_CONTENT_TYPES[logo.ext],
      "Content-Length": String(bytes.length),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
