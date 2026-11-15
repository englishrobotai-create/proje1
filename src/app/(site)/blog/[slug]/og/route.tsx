import { prisma } from "@/lib/db";
import { renderOgImage } from "@/lib/og-image";
import { getSiteSettings } from "@/lib/settings";

// Yazı başlığı değişince görsel de değişsin; önbellek kısa tutulur.
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.published) {
    return new Response("Bulunamadı", { status: 404 });
  }

  const settings = await getSiteSettings();
  return renderOgImage({ headline: post.title, footnote: settings.siteTitle });
}
