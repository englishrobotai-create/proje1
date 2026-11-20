import type { Metadata } from "next";
import { NotFoundContent } from "@/components/NotFoundContent";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isPortalEnabled } from "@/lib/portal-db";
import { getSiteSettings } from "@/lib/settings";
import { getSiteLogo, siteLogoSource } from "@/lib/site-logo";

// Başlık, kök layout'taki şablonla "Sayfa bulunamadı | Site adı" olur.
// Next.js 404 yanıtlarına kendiliğinden noindex ekler.
export const metadata: Metadata = { title: "Sayfa bulunamadı" };

/**
 * Hiçbir sayfayla eşleşmeyen adresler için 404. Bu durumda (site) düzeni devreye
 * girmediği için üst menü ve alt bilgi burada elle eklenir. (site) ve admin içindeki
 * notFound() çağrıları kendi klasörlerindeki not-found.tsx dosyasını kullanır;
 * böylece menü iki kez çizilmez.
 */
export default async function NotFound() {
  const [settings, portalEnabled, logo] = await Promise.all([
    getSiteSettings(),
    isPortalEnabled(),
    getSiteLogo(),
  ]);
  const { src: logoSrc } = siteLogoSource(logo);

  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader
        settings={settings}
        logoSrc={logoSrc}
        portalEnabled={portalEnabled}
      />
      <main className="flex-1">
        <NotFoundContent />
      </main>
      <SiteFooter
        settings={settings}
        logoSrc={logoSrc}
        portalEnabled={portalEnabled}
      />
    </div>
  );
}
