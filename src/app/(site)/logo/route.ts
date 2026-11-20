import {
  PHOTO_CONTENT_TYPES,
  getSiteLogo,
  readSiteLogoFile,
} from "@/lib/site-logo";

// Yüklenen site logosu. ?v= sürümü ile uzun önbelleğe alınabilir.
export const dynamic = "force-dynamic";

export async function GET() {
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
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
