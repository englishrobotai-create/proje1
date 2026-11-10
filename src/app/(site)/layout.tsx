import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSiteSettings } from "@/lib/settings";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { siteTitle } = await getSiteSettings();

  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader siteTitle={siteTitle} />
      <main className="flex-1">{children}</main>
      <SiteFooter siteTitle={siteTitle} />
    </div>
  );
}
