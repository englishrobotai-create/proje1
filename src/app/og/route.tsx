import { renderOgImage } from "@/lib/og-image";
import { getSiteSettings } from "@/lib/settings";

// Sayfası özel görseli olmayan tüm sayfaların paylaşım görseli (site adı).
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSiteSettings();
  return renderOgImage({
    headline: settings.siteTitle,
    footnote: "Mali Müşavirlik ve Vergi Danışmanlığı",
  });
}
