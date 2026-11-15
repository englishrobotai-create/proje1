import { JsonLd } from "@/components/JsonLd";
import { SiteEffects } from "@/components/SiteEffects";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isPortalEnabled } from "@/lib/portal-db";
import { buildSiteGraph } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";
import { titleCssVars } from "@/lib/title-fonts";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, portalEnabled] = await Promise.all([
    getSiteSettings(),
    isPortalEnabled(),
  ]);

  // Ayarlar'dan seçilen başlık yazı tipi/boyutu; header ve footer bu değişkenleri CSS'te okur.
  const title = titleCssVars(settings.titleFont, settings.titleScale);

  return (
    <div
      className="min-h-full flex flex-col"
      style={title.style}
      data-title-custom={title.custom ? "" : undefined}
    >
      <JsonLd data={buildSiteGraph(settings)} />
      <SiteEffects />
      <SiteHeader settings={settings} portalEnabled={portalEnabled} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} portalEnabled={portalEnabled} />
    </div>
  );
}
