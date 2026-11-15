import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IconLock } from "@/components/Icons";
import { PageHero } from "@/components/PageHero";
import { isPortalEnabled } from "@/lib/portal-db";

// Mükellef Köşesi kapalıyken bu yolların hiçbiri yokmuş gibi davranır.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mükellef Köşesi",
  robots: { index: false, follow: false },
  // Şifre bağlantısındaki jeton başka sitelere sızmasın.
  referrer: "no-referrer",
};

export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!(await isPortalEnabled())) notFound();

  return (
    <>
      <PageHero
        title="Mükellef Köşesi"
        description="Belgelerinizi güvenle iletin, ofisin size gönderdiği dosyalara ulaşın."
        icon={IconLock}
      />
      <section className="section">
        <div className="container">{children}</div>
      </section>
    </>
  );
}
