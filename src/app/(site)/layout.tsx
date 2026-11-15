import { JsonLd } from "@/components/JsonLd";
import { SiteEffects } from "@/components/SiteEffects";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isPortalEnabled } from "@/lib/portal-db";
import { buildSiteGraph } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, portalEnabled] = await Promise.all([
    getSiteSettings(),
    isPortalEnabled(),
  ]);

  return (
    <div className="min-h-full flex flex-col">
      <JsonLd data={buildSiteGraph(settings)} />
      <SiteEffects />
      <SiteHeader settings={settings} portalEnabled={portalEnabled} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} portalEnabled={portalEnabled} />
    </div>
  );
}
